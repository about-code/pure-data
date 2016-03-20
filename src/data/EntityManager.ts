"use strict";
import {type} from "../util/type";
import {ID, ID_PROPERTY} from "./Identity";
import {Metadata} from "./Metadata";
import {EntitySet} from "../collection/collection";
import {IContext} from "./IContext";

/**
 *
 * The entity manager is a factory and cache (or context) for entity instances.
 * It ensures, that there will be only one particular entity instance in its
 * context even if there are multiple attempts to load or create one.
 * [[Entity]] instances should always be created using an
 * entity manager rather than using `new`.
 *
 * The entity factory method accepts a data object whose properties and values
 * will be set on the returned instance. In a process called deserialization
 * the @datatype and @field metadata will be evaluated to reason which data
 * properties need instantiation of a complex data type. Because the entity
 * manager will only create one instance of a particular identifiable entity,
 * graph-like data structures which contain IDs can be instantiated into an
 * object graph with proper object references.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 */
export class EntityManager implements IContext {

    private static knownEntityTypes = {};

    /**
     * A structure:
     * ```javascript
     * {
     *   type1: {
     *     "$anonymous": [unidentified1, unidentified2, ...]
     *     id1: entity1,
     *     id2: entity2,
     *      ...
     *   },
     *   type2: {
     *     "$anonymous": [unidentified1, unidentified2, ...]
     *     id1, entity1,
     *     id2, entity2,
     *     ...
     *   },
     *   ...
     * }
     * ```
     * @type {object}
     */
    private _entities = null;

    constructor(opts) {
        Object.assign(this, opts);
        this._entities = {};
    }

    static registerEntityTypeCtor(entityTypeName:string, entityTypeCtor:Function) {
        EntityManager.knownEntityTypes[entityTypeName] = entityTypeCtor;
    }

    static getEntityTypeCtor(entityTypeName:string): {new();} {
        return EntityManager.knownEntityTypes[entityTypeName];
    }

    /**
     * A factory method which returns an entity instance. If there is not yet
     * an entity instance with the same identity (constructor + id) as to be
     * constructed, then a new instance is created with the given constructor using `new`
     * operator. If there already exists an instance, however, we set the given
     * `data` on the existing instance and return it.
     *
     * ```typescript
     *   class Foo extends Model {
     *   	constructor() { ... }
     *   };
     *   var em = new EntityManager();
     *   var foo  = em.create(Foo, {id: 'a'});
     *   var foo2 = em.create(Foo, {id: 'a'});
     *   var foo3 = entity.lookup(Foo, 'a');
     *   console.log(foo === foo2);    // => true
     *   console.log(foo2 === foo3);   // => true
     * ```
     *
     * @param {function} EntityTypeCtor Constructor for some entity type
     * @param {object|string|number} data Properties to mix into an existing instance or to pass to the constructor for a new instance.
     * @return {EntityTypeCtor} An entity instance from cache or a new (immediately cached) one
     */
    create(EntityTypeCtor, data) {
        var id,
            plainIdPropertyName,
            postCtorId,
            entity,
            entities = this._entities;

        if (type.isObject(data)) {
            id = data[ID_PROPERTY(EntityTypeCtor)];
        } else {
            id = data;
        }

        entity = this.lookup(EntityTypeCtor, id);
        if (entity) {
            // There is an existing entity. Just set the new properties.
            entity.merge(data);
            return entity;
        } else  {
            // There has no identical entity been registered and instantiated so
            // far. So we create one using the 'new' operator and register it.
            entity = new EntityTypeCtor();
            if (type.isInitialized(id)) {
                entity[ID_PROPERTY(entity)] = id;
            }
            this.attach(entity);
            if (type.isFunction(entity.constructed)) {
                entity.constructed(data);
            }
            return entity;
        }
    }


    /**
     * This function registers an [[Entity]] with the manager.
     * Registering objects with their ID and constructor helps to keep track
     * of entities. **In most cases calling attach directly is not necessary
     * or recommended.** Rather use `create()` to instantiate an entity which
     * will register the returned entity.
     * @protected
     *
     * @param {object} entity The entity to register.
     */
    attach(entity) {
        if (!type.isObject(entity)) {
            return false;
        }

        var id = ID(entity),
            typeName = Metadata.aboutClassOf(entity).getClassName(),
            entities = this._entities;

        if (! entities.hasOwnProperty(typeName)) {
            entities[typeName] = { $anonymous: [] };
        }

        if (id) {
            id = id.toString();

            // check if an entity has previously existed without an ID
            // and remove it from the set of anonymous entities when
            // re-attached with an ID.
            this.removeAnonymous(entity);

            if (! this.lookup(entity)) {
                entities[typeName][id] = entity;
                entity.$context = this;
            }
        } else {
            this.addAnonymous(entity);
            entity.$context = this;
        }
    }

    /**
     * Lookup a particular entity in the entity manager's cache. Does not
     * load any data from a store. Supports two different arguments in the
     * following combination:
     *
     * 1. lookup(obj), looks whether there's an entity with the same id and type name like 'obj'
     * 2. lookup(function, id), looks whether there's an entity of type 'function' with a given id
     *
     * @param {function|object} arg0 Entity type constructor or entity instance
     * @param {string} arg1 id The entity ID to look for. Will only be evaluated if `arg1` is an entity type or an entity instance without an ID.
     * @return {object|undefined} The looked up entity or `undefined` if none was found.
     */
    lookup(arg0:Function|Object, arg1?:string) {
        var id,
            Ctor,
            meta,
            typeName,
            entities = this._entities;

        if (arguments.length === 2 && type.isFunction(arg0)) {
            Ctor = arg0;
            id   = arg1;
        } else if (arguments.length === 1 && type.isObject(arg0)) {
            Ctor = arg0.constructor;
            id   = ID(arg0);
        } else {
            throw new Error("Invalid arguments.");
        }
        meta = Metadata.aboutClassOf(Ctor);
        if (! meta) {
            return;
        }
        typeName = meta.getClassName();
        id = id && id.toString ? id.toString() : "";
        return (entities.hasOwnProperty(typeName) && entities[typeName].hasOwnProperty(id)) ? entities[typeName][id] : undefined;
    }

    /**
     * Release an object from entity management. The object won't be destroyed
     * but becomes unmanaged. A new object instance with the same ctor+id
     * combination can be registered once the method finished. This is
     * similar to Hibernate's `Session.evict()`
     *
     * @param {object} entity The entity to unregister
     */
    detach(entity) {
        var id,
            typeName,
            entities = this._entities,
            anonymousIdx = -1;

        if (type.isObject(entity) && entity.$context === this) {
            id = ID(entity);
            id = id && id.toString ? id.toString() : "";
            typeName = Metadata.aboutClassOf(entity).getClassName();
            if (entities.hasOwnProperty(typeName) && entities[typeName].hasOwnProperty(id)) {
                delete entities[typeName][id];
            } else {
                this.removeAnonymous(entity);
            }
            if (entity.$context === this) {
                entity.$context = null;
            }
        }
    }

    /**
     * Returns a change record with created, modified (dirty) or removed
     * entities. The record has the following structure:
     * ```javascript
     * {
     *     created: Array<data/Entity>
     *     updated: Array<data/Entity>
     *     removed: Array<data/Entity>
     * }
     * ```
     * @param {string} [typeName=null] An optional type name to get changes for a particular entity type.
     * @return {object} A record with the structure described above.
     */
    getModifiedEntities(typeName):any {
        var entities = this._entities,
            typeNames = Object.getOwnPropertyNames(entities),
            changes = {
                created: [],
                updated: [],
                removed: []
            },
            i,
            iLen,
            getModified = function (typeName, changes) {
                var entitiesOfType = entities[typeName],
                    entityIDs = Object.getOwnPropertyNames(entitiesOfType),
                    entity = null,
                    id = "",
                    j,
                    jLen;

                changes.created = changes.created.concat(entitiesOfType.$anonymous);
                for (j = 0, jLen = entityIDs.length; j < jLen; j += 1) {
                    id = entityIDs[j];
                    entity = entities[id];
                    if (entity && entity.$removed) {
                        changes.removed.push(entity);
                    } else if (entity && entity.isDirty()) {
                        changes.updated.push(entity);
                    }
                }
            };

        if (typeName) {
            return getModified(typeName, changes);
        } else {
            for (i = 0, iLen = typeNames.length; i < iLen; i += 1) {
                getModified(entities[typeNames[i]], changes);
            }
            return changes;
        }
    }

    /**
     * Cleans the internal cache. This is similar to detaching all
     * attached entities at once.
     */
    clear() {
        delete this._entities;
        this._entities = {};
    }

    /**
     * TODO: Inovke destroy() on any entity instance held by the manager?
     */
    destroy() {
        this.clear();
    }

    private addAnonymous(entity) {
        var anonEntities = (this._entities[Metadata.aboutClassOf(entity).getClassName()] || {}).$anonymous,
            idx = -1;
        if (anonEntities) {
            idx = anonEntities.indexOf(entity);
        }
        if (idx < 0) {
            anonEntities.push(entity);
        }
    }

    private removeAnonymous(entity) {
        var anonEntities = (this._entities[Metadata.aboutClassOf(entity).getClassName()] || {}).$anonymous,
            idx = -1;
        if (anonEntities) {
            idx = anonEntities.indexOf(entity);
        }
        if (idx >= 0 && entity) {
            anonEntities.splice(idx,1);
        }
    }
};
