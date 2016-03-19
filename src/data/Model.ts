/*global define*/
 "use strict";

import {applyMixins} from "../lang/typescript";
import {shared} from "../lang/typescript";
import {Log, type, defaults} from "../util/util";
import {ArraySet, EntitySet, SimpleMap} from "../collection/collection";
import {ID, ID_PROPERTY} from "./Identity";
import {Metadata} from "./Metadata";
import {Entity} from "./Entity";
import {EntityManager} from "./EntityManager";
import {ObjectMapper} from "./ObjectMapper";
import {Observable} from "./Observable";
import {Field, OwnField} from "./Field";
import {Association} from "./Association";
import {IContext} from "./IContext";

var log = Log.getLogger("data/Model");
/**
 * Base class for data model entities.
 *
 * *Example:*
 *
 * ```typescript
 *  import {datatype, field, id} from "pure/data/decorators";
 *  import {Model} from "pure/data/data";
 *
 *  @datatype("Person")
 *  class Person extends Model {
 *
 *     @id
 *     @field(alias: "ID")
 *     id: string;
 *
 *     @field(alias: "first_name")
 *     firstName: string;
 *
 *     @field(alias: "last_name")
 *     lastName:string;
 *
 *     constructor() {
 *        ...
 *     }
 *  }
 * ```
 * **Note:** Models should not be instantiated with `new`. By using the factory
 * method [[EntityManager.create]] instead, the factory can assist in properly
 * mapping (deserializing) a plain *data object*, especially if the data structure
 * has circular references. For example, think of a JSON tree where a nested object
 * holds an ID reference to its parent object which has to be deserialized/mapped
 * to an object reference.
 *
 * **Note:** [[Model]] instances will have some properties prepended with a
 * `$`. These aren't actually part of the model (from a domain or business perspective)
 * but provide information to the model framework. They aren't private but *internal
 * to the framework* and therefore should not be accessed directly. Like properties
 * prepended with an underscore ('_') they won't be serialized.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */
export class Model extends Entity {

    /**
     * The serialization depth to use when saving instances or calling
     * serialize(). Default is 1. Use -1 to serialize up to maximum depth
     * (currently 25). The value may be temporarily overwritten by options
     * passed to the particular methods which deal with serialization.
     * @default 1
     */
    @shared(1) $serializeDepth:number;
    @shared(null) _changesStream;

    private _meta:Metadata;
    private $ownFields:SimpleMap<OwnField> = {};
    private $ownAssociations:SimpleMap<Association> = {};

    /**
     * **Don't instantiate Models with `new`. Instead use [[EntityManager.create]]**.
     */
    constructor() {
        super();
    }

    /**
     * Post-constructor logic to initialize a [[Model]] instance.
     *
     * @param {object} [data] The data to mix into the instance.
     */
    constructed(data?:Object) {
        this.applyMeta();
        super.constructed(data);
        if (type.isObject(data)) {
            ObjectMapper.fromPlainObject(data, this);
        }
        this.setDirty(false);
    }

    /**
     * Merges properties and values of `data` into `this`.
     * **Note:** Merging will set the instance's dirty state
     * to *false*. If you intend to *set* values use [[.set()]]
     */
    merge(data:Object) {
        super.merge(data);
        ObjectMapper.fromPlainObject(data, this);
        this.setDirty(false);
    }

    /**
     * Returns a plain JavaScript object based on the model's field configurations.
     */
    serialize(opts?: {serializeDepth?:number, scenario?:string}):Object {
        return ObjectMapper.toPlainObject(this, opts);
    }

    toJSON():Object {
        return ObjectMapper.toPlainObject(this, { serializeDepth: 1 });
    }

    /**
     * Deserializes/merges a plain data object into a model instance.
     *
     * Depending on the structure of `data` as well as the target model's schema,
     * initializing an entity causes related entities to be deserialized or
     * instantiated and initialized as well.
     *
     * @param props {(object|string|number)} data
     */
    deserialize(data:Object, opts?) {
        if (type.isObject(data)) {
            return ObjectMapper.fromPlainObject(data, this, opts);
        }
    }

    get(propName) {
        return super.get(propName);
    }

    /** @override */
    set(propNameOrHash, value?) {
        var p = "",
            prop = null,
            newValue,
            oldValue,
            instance;

        if (typeof propNameOrHash === "string") {
            p = propNameOrHash;
            propNameOrHash = {};
            propNameOrHash[p] = value;
        }

        for (p in propNameOrHash) {
            if (propNameOrHash.hasOwnProperty(p) && p !== ID_PROPERTY(this)) {
                oldValue = this[p];
                newValue = propNameOrHash[p];
                if (oldValue !== newValue) {
                    this.setDirty(true);
                    prop = this.field(p);
                    if (prop) {
                        prop.put(newValue);
                        delete propNameOrHash[p];
                    } else if (this.hasOwnProperty(p)) {
                        this[p] = propNameOrHash[p];
                        delete propNameOrHash[p];
                    }
                }
            }
        }
        super.set(propNameOrHash);
    }

    /**
     * Returns a Field instance which may be used to do things such as
     * listening for changes to the property value or validation errors etc.
     */
    field(propName):OwnField {
        var meta = Metadata.aboutClassOf(this),
            prop = null,
            superMeta = null;
        if (! this.$ownFields[propName]) {
            prop = meta.getField(propName);
            if (prop) {
                this.$ownFields[propName] = prop.getOwnField(this);
                return this.$ownFields[propName];
            } else {
                // look for field in superclass;
                superMeta = Metadata.aboutClassOf(meta.getSuperClass());
                if (superMeta) {
                    prop = superMeta.getField(propName);
                    if (prop) {
                        this.$ownFields[propName] = prop.getOwnField(this);
                        return this.$ownFields[propName];
                    }
                }
            }
            return;
        } else {
            return this.$ownFields[propName];
        }
    }

    /**
     * @return {Array.<data/Association>} Associations of an entity and its supertypes.
     */
    associations() {
        var superclass,
            meta = Metadata.aboutClassOf(this),
            assocs = null;

        // infer further associations from superclasses
        // superclass = Object.getPrototypeOf(this.constructor); // ES6-compliant but not TypeScript compliant...
        while(meta) {
            assocs = !assocs ? meta.getAssociations() : assocs.concat(meta.getAssociations());
            meta = Metadata.aboutClassOf(meta.getSuperClass());
        }
        return assocs;
    }

    /**
     * @param {string} [fieldName=null] The field to test for changes. If falsy the result indicates
     * if any of the model's fields is dirty.
     * @return {boolean} True if the given field or any field was modified, false otherwise.
     */
    isDirty(fieldName) {
        var key,
            ownFields = this.$ownFields;
        if (fieldName) {
            return ownFields[fieldName] && ownFields[fieldName].isDirty();
        } else {
            for (key in ownFields) {
                if (ownFields.hasOwnProperty(key)) {
                    if (ownFields[key].isDirty()) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    setDirty(bool, fieldName?) {
        var key,
            ownFields = this.$ownFields;
        if (fieldName) {
            return ownFields[fieldName] && ownFields[fieldName].set("dirty", bool);
        } else {
            for (key in ownFields) {
                if (ownFields.hasOwnProperty(key)) {
                    ownFields[key].set("dirty", bool);
                }
            }
        }
    }

    /**
     * @return {Promise}
     */
    remove() {
        var associations = this.associations(),
            i = 0,
            iLen= associations.length;

        for (i = 0; i < iLen; i += 1) {
            associations[i].remove(this);
        }
        this.set({"$removed": true});
    }


    isRemoved() {
        return this.$removed;
    }

    destroy() {
        var key,
            ownFields = this.$ownFields,
            ownAssociations = this.$ownAssociations;

        for (key in ownFields) {
            if (ownFields.hasOwnProperty(key)) {
                ownFields[key].destroy();
            }
        }
        this.$ownFields = {};

        for (key in ownAssociations) {
            if (ownFields.hasOwnProperty(key)) {
                ownFields[key].destroy();
            }
        }
        this.$ownAssociations = {};
    }

    /**
     * Returns a changes stream which clients can subscribe to in order to
     * get notified about changes to any model instance.
     */
    static changes() {
        return Model.prototype._changesStream;
    }

    private applyMeta() {
        var meta = Metadata.aboutClassOf(this),
            fields = meta.getFields(),
            associations,
            p;

        if (!type.isObject(fields)) {
            return;
        }

        // parse type-level associations only once, per Model type.
        if (!meta.isComplete()) {
            for (p in fields) {
                this.$ownFields[p] = fields[p].getOwnField(this);
                if (fields.hasOwnProperty(p) && !type.isFunction(this[p])) {
                    this.parseAssociation(fields[p]);
                }
            }
            meta.isComplete(true);
        }

        // set up instance level "own associations" (bindings) for new model instances
        associations = Metadata.aboutClassOf(this).getAssociations();
        if (associations) {
            associations.forEach((assoc) => {
                this.$ownAssociations[assoc.id] = assoc.getOwnAssociation(this);
            });
        }
    }

   /**
    * Determine how two models are related. The association will be
    * derived from field options `type`, `dtype` and `inverse`.
    * If two entities e1 and e2 are associated, then `inverse` of a
    * field of e1 refers to some field in e2 and vice versa.
    *
    * If the linked field's' `type` is "array" on both sides, then a
    * many-to-many-association is created. If `type` is "array" on one side,
    * only, then a one-to-many or many-to-one association is created. If it
    * isn't "array" on either side, then a one-to-one association is created.
    */
   private parseAssociation(field) {

       var f_name = field.get("name"),
           f_ctor = field.get("dtype"),
           f_inverse = field.get("inverse"),
           meta = Metadata.aboutClassOf(this),
           relatedClass,
           relatedClassMeta,
           relatedClassName,
           relatedClassProperties,
           f_type_left,
           f_type_right;

       /*
        * Check Prerequisites
        */
       if (! f_inverse || !(typeof f_ctor === "function")) {
           return; // nothing to associate
       } else {
           relatedClass = f_ctor.prototype;
           relatedClassMeta = Metadata.aboutClassOf(relatedClass);
           relatedClassName = relatedClassMeta.getClassName();
           relatedClassProperties = relatedClassMeta.getFields();
       }

       if (!relatedClassName) {
           log.error("Could not link field '" + f_name + "'. At least one participating " +
                     "class misses the @datatype decorator.", this, relatedClass);
           return;
       } else if (!relatedClassProperties) {
           log.error("Could not associate " + meta.getClassName() + " and " +
               relatedClassName + " via field '" + f_name + "'. No schema " +
               "defined in " + relatedClassName + ".");
           return;
       } else if (!relatedClassProperties.hasOwnProperty(f_inverse)) {
           log.error("Could not associate " + meta.getClassName() + " and " +
                     relatedClassName + " via field '" + f_name + "'. " +
                     relatedClassName + " has no field '" + f_inverse +
                     "'.");
           return;
       }

       // "left" is this (= source of directed association);
       f_type_left  = field.get("type");
       f_type_right = relatedClassMeta.getField(f_inverse).get("type");

       // Create association. Kind of association derived from the `type`
       // configuration on both sides of the linked fields.
       meta.addAssociation(new Association({
           source: {
               name: f_name,
               type: f_type_left,
               ctor: this.constructor,
               className: meta.getClassName()
           },
           target: {
               name: f_inverse,
               type: f_type_right,
               ctor: f_ctor,
               className: relatedClassName
           }
       }));
   }
}
applyMixins(Model, [Observable]);
