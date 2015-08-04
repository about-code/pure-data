/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @description
 * The entity manager is a factory and cache (or context) for entity instances.
 * It ensures, that there will be only one particular entity instance in its
 * context even if there are multiple attempts to load or create one.
 * {@link data/Entity|Entity} instances should always be created using an
 * entity manager rather than using `new`.
 *
 * When the store creates a Model instance via the entity manager,
 * the entity manager will pass itself to the Model. In a process called
 * deserialization the Model will be initialized with entity data thereby
 * reasoning from the schema for which properties related Models have to be
 * instantiated. Since the entity manager will be used by the deserializer
 * recursive references in entity data are gracefully resolved to the right
 * entity.
 *
 * Fetching remote data requires an implementation of the {@link data/StoreAdapter}
 * interface to be injected by using the injection key `data/storeAdapter`
 * (see {@link module:util/inject|inject module}).
 *
 * @constructor data/EntityManager
 */
define([
   "dojo/_base/lang",
   "dojo/_base/declare",
   "../util/type",
   "../util/log!data/EntityManager",
   "../util/inject!data/EntityManager",
   "../collection/EntitySet"
], function(lang, declare, type, log, inject, EntitySet) {

    var STORE_ADAPTER_DEPENDENCY = {
        id: "data/storeAdapter",
        interface: "data/StoreAdapter"
    };
    var EntityManager = declare([], /** @lends data/EntityManager.prototype */ {

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
         * @private
         */
        _entities: {},

        constructor: function(opts) {
            lang.mixin(this, opts);
            this._stores = {};
            this._entities = {};
            this._storeAdapter = inject(STORE_ADAPTER_DEPENDENCY);
        },

        /**
         * A factory method which returns an entity instance. If there is not yet
         * an entity instance with the same identity (constructor + id) as to be
         * created, then a new instance is created with the given constructor using 'new'
         * operator. If there already exists an instance, however, we merge() the given
         * `props` into the existing instance and return it. If there is no `merge()`
         * method the existing entity's constructor will be invoked as normal function,
         * that is, without the `new` operator. Responsibility of `merge()` (and if there
         * is no `merge()`, then responsibility of the constructor) is, to properly mix
         * in `props` into an existing entity instance.
         * Note that when a new entity instance is created, the ID passed via `props`
         * will overwrite any ID which might have been set in the constructor
         * (see example 1 below).
         *
         * Example 1:
         * ```javascript
         *   var manager = new EntityManager();
         *   var Ctor = function() {this.id = 'a';};  // enitty constructor
         *   var e = manager.create(Ctor, {id: 'b'}); // create entity instance
         *   entity.lookup(Ctor, 'a');                // returns undefined
         *   entity.lookup(Ctor, 'b');                // returns e
         *   console.log(e.id);                       // prints 'b'
         * ```
         *
         * Example 2:
         * ```javascript
         *   var manager = new EntityManager();
         *   var Ctor = function() {this.id = 'a'};
         *   var e = create(Ctor);
         *   entity.lookup(Ctor, 'a'); // returns e
         *   console.log(e.id);        // prints 'a'.
         * ```
         *
         * Example 3:
         * ```javascript
         *   var Ctor = function() {};
         *   var e = manager.create(Ctor, {id: 'b'});
         *   entity.lookup(Ctor, 'b'); // returns b
         *   console.log(e.id);        // prints 'b'
         * ```
         *
         * Example 4:
         * ```javascript
         *   var Ctor = function(props) {this.id = props.id};
         *   var e = manager.create(Ctor, {id: 'b'});
         *   console.log(e.id);        // prints 'b'.
         * ```
         *
         * @param {function} EntityTypeCtor Constructor for some entity type
         * @param {object|string|number} props Properties to mix into an existing instance or to pass to the constructor for a new instance.
         * @return {EntityTypeCtor} An entity instance from cache or a new (immediately cached) one
         */
        create: function(EntityTypeCtor, props) {
            var id,
                plainIdPropertyName,
                postCtorId,
                typeName,
                entity,
                entities = this._entities,
                schema = EntityTypeCtor.prototype.$schema;

            typeName = EntityTypeCtor.prototype.$name;

            if (type.isObject(props)) {
                // note: props might be raw data. Try reading the id from the
                // property configured as $idProperty.
                id = props[EntityTypeCtor.prototype.$idProperty || "id"];
            } else {
                id = props;
            }

            entity = this.lookup(EntityTypeCtor, id);
            if (entity) {
                // There is an existing entity. No need to create a new one.
                // In this case we mix the given properties into the existing
                // entity instance. Knowledge about how to do this properly is
                // implemented in an entity's merge() method
                if (type.isFunction(entity.merge)) {
                    entity.merge(props);
                } else {
                    entity.constructor(props, this);
                }
                return entity;
            } else  {
                // There has no identical entity been registered and instantiated so
                // far. So we create one using the 'new' operator and register it.
                // Any id which may have been set in the constructor will be
                // overwritten with the id given in 'props' to make sure the Id
                // known to the registry matches the id of the entity instance.
                // Since we use a ECMAScript5 feature to make entity ids read-only,
                // we check for writability before setting the corresponding value.
                entity = new EntityTypeCtor(props || null, this);
                postCtorId = entity.id;
                if (type.isInitialized(id) && postCtorId !== id) {
                    this.detach(entity);
                    entity.id = id;
                    this.attach(entity);
                } else {
                    this.attach(entity);
                }
                return entity;
            }
        },

        /**
         * Returns a managed collection for a particular entity type.
         * *Managed* means: if `data` is an array of primitive identifiers or
         * plain objects, then these will be instantiated into entities of the
         * given entity type (`EntityTypeCtor`) using this entity manager. Same happens
         * when pushing or splicing new data into the created collection later
         * on (see {@link collection/EntitySet|EntitySet}).
         *
         * @param {function} EntityTypeCtor the desired EntityType for the collection
         * @param {Array<object|string|number>} data An array with plain entity data objects or entity identifiers.
         * @return {collection/EntitySet<EntityTypeCtor>} The new entity set instance
         * @see {@link collection/EntitySet}
         */
        createCollection: function(EntityTypeCtor, data) {
            return EntitySet.create(EntityTypeCtor, data, this);
        },

        /**
         * This function registers an {@link data/Entity|entity} with the manager.
         * Registering objects with their ID and constructor helps to keep track
         * of entities. **In most cases calling attach directly is not necessary
         * or recommended.** Rather use `create()` to instantiate an entity which
         * will register the returned entity.
         * @protected
         *
         * @param {object} entity The entity to register.
         */
        attach: function(entity) {
            if (!type.isObject(entity)) {
                return false;
            }

            var id = entity.id,
                typeName = entity.$name,
                entities = this._entities;

            if (! entities.hasOwnProperty(typeName)) {
                entities[typeName] = { $anonymous: [] };
            }

            if (id) {
                id = id.toString();

                // check if an entity has previously existed without an ID
                // and remove it from the set of anonymous entities when
                // re-attached with an ID.
                removeAnonymous.call(this, entity);

                if (! this.lookup(entity)) {
                    entities[typeName][id] = entity;
                    entity.$entityManager = this;
                }
            } else {
                addAnonymous.call(this, entity);
                entity.$entityManager = this;
            }
        },

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
        lookup: function(arg0, arg1) {
            var id,
                Ctor,
                typeName,
                entities = this._entities;

            if (arguments.length === 2 && type.isFunction(arg0)) {
                Ctor = arg0;
                id   = arg1;
            } else if (arguments.length === 1 && type.isObject(arg0)) {
                Ctor = arg0.constructor;
                id   = arg0.id;
            } else {
                throw new Error("Invalid arguments.");
            }
            typeName = Ctor.prototype.$name;
            id = id && id.toString ? id.toString() : "";
            return (entities.hasOwnProperty(typeName) && entities[typeName].hasOwnProperty(id)) ? entities[typeName][id] : undefined;
        },

        /**
         * Release an object from entity management. The object won't be destroyed
         * but becomes unmanaged. A new object instance with the same ctor+id
         * combination can be registered once the method finished. This is
         * similar to Hibernate's `Session.evict()`
         *
         * @param {object} entity The entity to unregister
         */
        detach: function(entity) {
            var id,
                typeName,
                entities = this._entities,
                anonymousIdx = -1;

            if (type.isObject(entity)) {
                id = entity.id;
                id = id && id.toString ? id.toString() : "";
                typeName = entity.$name;
                if (entities.hasOwnProperty(typeName) && entities[typeName].hasOwnProperty(id)) {
                    delete entities[typeName][id];
                } else {
                    removeAnonymous.call(this, entity);
                }
                if (entity.$entityManager === this) {
                    entity.$entityManager = null;
                }
            }
        },

        /**
         * @param {data/Entity} entity The entity to get data for.
         * @return {Promise<data/Entity>} ES6-compatible promise which resolved to the entity filled with fetched entity data.
         */
        fetch: function(entity) {
            var promise;
            if (this._storeAdapter) {
                if (!entity.id) {
                    return new Promise(function(resolve, reject) {
                        reject(new Error("Can't fetch anonymous entities with empty 'id' property."));
                    });
                }
                promise = this._storeAdapter.fetch(entity.constructor, entity.id);
                return promise.then(function(entityData) {
                    entity.merge(entityData);
                    entity.setDirty(false);
                    return entity;
                });
            } else {
                return new Promise(function(resolve, reject) {
                    reject(new Error("No store adapter configured. Use dependency injection. Injection info: " + JSON.stringify(STORE_ADAPTER_DEPENDENCY)));
                });
            }
        },

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
        getModifiedEntities: function (typeName) {
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
        },

        /**
         * Cleans the internal cache. This is similar to detaching all
         * attached entities at once.
         */
        clear: function() {
            delete this._entities;
            this._entities = {};
        },

        /**
         * TODO: Inovke destroy() on any entity instance held by the manager?
         */
        destroy: function() {
            this.clear();
        },
    });


    // --- private interface ---

    function addAnonymous(entity) {
        var anonEntities = (this._entities[entity.$name] || {}).$anonymous;
            idx = -1;
        if (anonEntities) {
            idx = anonEntities.indexOf(entity);
        }
        if (idx < 0) {
            anonEntities.push(entity);
        }
    }

    function removeAnonymous(entity) {
        var anonEntities = (this._entities[entity.$name] || {}).$anonymous;
            idx = -1;
        if (anonEntities) {
            idx = anonEntities.indexOf(entity);
        }
        if (idx >= 0 && entity) {
            anonEntities.splice(idx,1);
        }
    }

    return EntityManager;
});
