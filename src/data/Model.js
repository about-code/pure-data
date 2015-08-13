/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @description
 * Base class for data model entities.
 * > Convention: properties which do not belong to the entity from a business
 * perspective but are meta or runtime information to the data library are
 * prepended with a `$` in order to best separate them when you use common
 * conventions for property names such as underscores for *your* private
 * variables.
 *
 * **It is not recommended to call a Model constructor directly. Instead use
 * ** [EntityManager#create()](./EntityManager.html#create). For a detailed
 * explanation have a look at the tutorial.
 *
 * @constructor data/Model
 * @extends data/Entity
 * @param {object} [data] The properties to mix into the instance.
 * @param {data/EntityManager}[entityManager] The entity manager hosting the
 * model instance and any instances created when deserializing `data`. If only
 * `data` is provided, none of the instances created during deserialization will
 * be managed. Attaching an entity *after* it has been created will only attach
 * the entity itself but none of its related instances. So you're advised to
 * always pass both parameters `data` and `entityManager` or none. In the latter
 * case you may call `init(data, entityManager)` after entity construction.
 * @tutorial modeling-data
 */
define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Stateful",
    "dojo/when",
    "dojo/Deferred",
    "dojo/promise/all",
    "../util/dtype",
    "../util/defaults",
    "../util/log!data/Model",
    "../collection/ArraySet",
    "../collection/EntitySet",
    "./Entity",
    "./Observable",
    "./Property",
    "./Association"
], function(require, declare, lang, Stateful, when, Deferred, promiseAll,
    type, defaults, log, ArraySet, EntitySet, Entity, Observable, Property, Association) {

    //"use strict";

    var Model = declare([Entity, Observable], /** @lends data/Model.prototype */ {

        $name: "",
        $properties: {},
        $aliases: {},
        $removed: false,

        /**
         * The schema definition for an entity.
         * @type {object}
         * @default null
         */
        $schema: null, // Do not initialize other than null here. Its on the prototype!

        /**
         * The serialization depth to use when saving instances or calling
         * serialize(). Default is 1. Use -1 to serialize up to maximum depth
         * (currently 25). The value may be temporarily overwritten by options
         * passed to the particular methods which deal with serialization.
         * @type {number}
         * @default 1
         */
        $serializeDepth: 1,

        /**
         * Maximum serialization depth to stop at. This is a safeguard
         * to avoid maximum call stack errors when serializing deep or recursive
         * object structures and should not be modified.
         * @type {number}
         * @const
         */
        SERIALIZE_DEPTH_MAXIMUM: 25,

        constructor: function(data, entityManager) {
            this.$properties = {};
            this.$aliases = {};
            this.$removed = false;

            if (type.isPrimitive(data)) {
                parseSchema.call(this, true);
            } else {
                parseSchema.call(this, false);
                this.deserialize(data);
            }
            this.setDirty(false);
        },

        init: function (data, entityManager) {
            this.inherited(arguments);
            this.deserialize(data);
            this.setDirty(false);
        },

        /**
         * Returns a plain JavaScript object based on the model's schema.
         * @param {object} opts Options.
         * ```
         * {
         *     serializeDepth: number,
         *     scenario: string
         * }
         * ```
         * @return {object}
         */
        serialize: function(opts) {
            return serialize.call(this, opts);
        },

        /**
         * Deserializes/merges a plain data object into a model instance.
         *
         * Depending on the structure of `data` as well as the target model's schema,
         * initializing an entity causes related entities to be deserialized or
         * instantiated and initialized as well.
         *
         * @param props {(object|string|number)} data
         */
        deserialize: function(data, opts) {
            if (type.isObject(data)) {
                return deserialize.call(this, data, opts);
            }
        },

        toJSON: function() {
            return serialize.call(this, {
                scenario: "*",
                serializeDepth: this.$serializeDepth
            });
        },

        get: function(propName) {
            return this.inherited(arguments);
        },

        /** @override */
        set: function(propName, newValue) {
            var oldValue = this[propName],
                instance;

            if (oldValue !== newValue) {
                if (propName !== "id"){
                    if (this.$schema.hasOwnProperty(propName)) {
                        this.property(propName).put(newValue);
                    }
                }
            }
            this.inherited(arguments);
        },

        /**
         * Returns a property object for a particular schema property to do things
         * such as listening for changes to the property value or validation
         * errors etc.
         * @return {data/OwnProperty} property object for a schema property
         */
        property: function(propName) {
            if (! this.$properties[propName]) {
                if (this.$schema) {
                    if (this.$schema[propName]) {
                        if (this.$schema[propName].getOwnProperty) {
                            this.$properties[propName] = this.$schema[propName].getOwnProperty(this);
                        } else {
                            // schema has not yet been parsed. (likely when
                            // looking for the property in the superclass)
                            var p = new Property({default: this.$schema[propName]});
                            this.$properties[propName] = p.getOwnProperty(this);
                        }
                        return this.$properties[propName];
                    } else {
                        // look for property in superclass ("schema inheritance");
                        return this.constructor.superclass.property(propName);
                    }
                } else {
                    return undefined;
                }
            } else {
                return this.$properties[propName];
            }
        },

        /**
         * @return {Array.<data/Association>} Associations of an entity and its supertypes.
         */
        associations: function() {
            var superclass,
                assocs = this.$associations || [];

            // infer further associations from superclasses
            superclass = this.constructor.superclass;
            while(superclass) {
                assocs = assocs.concat(superclass.$associations || []);
                superclass = superclass.constructor.superclass;
            }
            return assocs;
        },

        /**
         * @param {string} [propertyName=null] The property to test for changes.
         * @return {boolean} True if one of the schema properties was modified, false otherwise.
         */
        isDirty: function(pName) {
            var p_obj,
                ownProperties = this.$properties;
            if (pName) {
                return ownProperties[pName] && ownProperties[pName].isDirty();
            } else {
                for (p_obj in ownProperties) {
                    if (ownProperties.hasOwnProperty(p_obj)) {
                        if (ownProperties[p_obj].isDirty()) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },

        setDirty: function(bool, pName) {
            var p_obj,
                ownProperties = this.$properties;
            if (pName) {
                return ownProperties[pName] && ownProperties[pName].set('dirty', bool);
            } else {
                for (p_obj in ownProperties) {
                    if (ownProperties.hasOwnProperty(p_obj)) {
                        ownProperties[p_obj].set('dirty', bool);
                    }
                }
            }
        },

        /**
         * @return {Promise}
         */
        remove: function(opts) {
            var associations = this.associations(),
                i = 0,
                iLen= associations.length;

            for (i = 0; i < iLen; i += 1) {
                associations[i].remove(this);
            }
            this.set("$removed", true);
        },


        isRemoved: function() {
            return this.$removed;
        },

        /**
         * @see {@link data/EntityManager#fetch|EntityManager#fetch}
         */
        fetch: function () {
            return this.$entityManager.fetch(this);
        },


        destroy: function () {
            var p, ownProperties = this.$properties;
            for (p in ownProperties) {
                if (ownProperties.hasOwnProperty(p)) {
                    ownProperties[p].destroy();
                }
            }
            this.$properties = {};
        }
    });

    /* private interface */

    function getId(obj) {
        if (type.isArray(obj)) {
            var id, i = 0, iLen = obj.length, result = [];
            for (i = 0; i < iLen; i += 1) {
                id = obj[i].id;
                if (id) {
                    result[i] = id;
                }
            }

            /* When serializing an object(-tree), then on the maximum serialization
             * depth, entities shall merely be rendered to their ID. If on that level,
             * an entity references a collection of other entities, then getId() is
             * expected to return an array of IDs in order to preserve the
             * association. Though, when the collection is empty, we do not know
             * if it is empty, because the last item has just been deleted
             * on the client or because the client has simply not yet loaded any
             * items. If we produce JSON like
             * {...
             *    myObj: {
             *       "id": 'xy',
             *       "myCollection": []
             *    }
             * ...
             * }
             * in a PUT-scenario then a server could interpret this as to UPDATE
             * 'myCollection' to an empty list, which in turn could mean to DELETE
             * all items in 'myCollection' if there exist any serverside.
             *
             * To avoid such side effects we have decided, that when we approach
             * the maximum serialization depth, then an empty entity collection
             * is serialized to NULL rather than to an empty array. This way the
             * server can interpret NULL as NO UPDATE on "myCollection".
             */
            return result.length > 0 ? result : null;

        } else {
            return obj.id;
        }
    }

    /*
     * @private
     * @static
     * Extends a model instance with schema properties. Handles assignment of
     * a default value defined in the schema via "simple" assignment
     * or a "complex" declaration using a property object. If 'default' attribute
     * of a property object is a function that "initializer" function will be
     * invoked (with "this" being undefined). Initializers
     * will be replaced by their own return value which is considered
     * the calculated default value for the property to which the initializer
     * was attached.
     *
     * Supported ways to declare a default value:
     * @example Usage
     * declare([Model], {
     *      $name: "MyEntity",
     *      $schema: {
     *           propertyA: "using direct assignment",
     *           propertyB: { default: "using property object" },
     *           propertyC: {
     *                default: function() {
     *                    return "using initializer function".
     *                }
     *           }
     *      }
     * });
     *
     * @param {boolean} omitDefaults Copy schema properties with defaults onto instance
     */
    function parseSchema(omitDefaults) {
        var that = this,
            schema = this.$schema,
            p, p_names, p_obj, p_default, p_plain, p_ctor, p_inverse, p_foreignForeignKey, tmp,
            i, iLen;

        // "schema" is a function which returns the schema object
        if (type.isFunction(schema)) {
            schema = this.$schema = schema.call(this);
        }
        if (!type.isObject(schema)) {
            return;
        }
        // Performance (Chrome): don't use "for(p in schema){...}" but iterate
        // via for-loop.
        p_names = Object.getOwnPropertyNames(schema);
        for (i = 0, iLen = p_names.length; i < iLen; i += 1) {
            p = p_names[i];
            if (!(schema[p] instanceof Property)) {
                // Create a Property instance from a plain property
                // object. Instantiation needs to be done only once per
                // entity, because the entity's schema is expected to be
                // declared statically on its prototype.
                if (!type.isObject(schema[p])) {
                    // "simple" property definition; not much to do...
                    p_obj = schema[p] = new Property({default: schema[p], name: p});
                } else {
                    // "complex" property definition
                    p_obj = schema[p] = new Property(schema[p], p);
                    p_ctor    = p_obj.get("dtype");
                    p_inverse = p_obj.get("inverse");

                    // if 'dtype' is a string, assume it to be an AMD module path
                    // and require that module.
                    if (type.isString(p_ctor)) {
                        if (p_ctor === "_self") {
                            p_ctor = this.constructor;
                        } else {
                            // get 'dtype' constructor from AMD module id
                            p_ctor = require(p_ctor);
                        }
                    }

                    // if we got a 'dtype' constructor, try to parse an
                    // association from 'type', 'dtype' and 'inverse'.
                    if (type.isFunction(p_ctor)) {
                        p_obj.set("dtype", p_ctor);
                        parseAssociation.call(this, schema[p]);
                    } else if (p_ctor) {
                        log.error("Property configuration 'dtype' can not be resolved to a constructor function.", p_ctor);
                        p_obj.set("dtype", null);
                        p_ctor = null;
                    }
                }
                this.$aliases[p_obj.get("plain") || p] = p;
            }

            p_default = schema[p].get("default");
            if (! omitDefaults) {
                // we do create a property on e only for those schema[p]
                // whose default is not 'undefined' *
                if (type.isDefined(p_default)) {
                    if (p instanceof Model) {
                        // If p_default is already a Model, then link it
                        // directly with e by assiging a refence to this[p].
                        // This is the "wiring" to build our entity graph.
                        // Cloning is only needed for plain "value objects".
                        // Further, calling clone() on Model entities, here,
                        // would cause an infinite loop, because clone()
                        // will call the Model constructor which again calls
                        // parseSchema() which is why we would end up here
                        // again.
                        this[p] = p_default;
                    } else {
                        this[p] = lang.clone(p_default);
                    }
                }
            }

            // Computed Properties:
            // if (schema[p].getValue || schema[p].setValue) {
                // Instantiate OwnProperty instances for computed properties
                // right away. Instantiating all schema properties, however
                // would cost performance. To manually create OwnProperties
                // for the other properties call schema[p].getOwnProperty(...)
                this.$properties[p] = schema[p].getOwnProperty(this);
            // }
        }

        // from type-level $associations, create instance level "own associations".
        // This will set up property observers to track updates.
        if (this.$associations) {
            this.$associations.forEach(function(assoc) {
                // see dijit/Destroyable#own()
                that.own(
                    assoc.getOwnAssociation(that)
                );
            });
        }
    }



    /**
     * Determine how two models are related. The association will be
     * derived from property options 'type', 'dtype' and 'inverse'.
     * If two entities e1 and e2 are associated, then 'inverse' in the schema
     * of e1 refers to some property in e2 and vice versa.
     *
     * If the linked properties' 'type' is "array" on both sides, then a
     * many-to-many-association is created. If 'type' is "array" on one side,
     * only, then a one-to-many or many-to-one association is created. If it
     * isn't "array" on either side, then a one-to-one association is created.
     */
    function parseAssociation(property) {

        var that = this,
            assoc,
            p = property.get("name"),
            p_ctor = property.get("dtype"),
            p_inverse = property.get("inverse"),
            linkedClass,
            p_type_left,
            p_type_right;

        /*
         * Check Prerequisites
         */
        if (! p_inverse) {
            return; // nothing to associate
        } else {
            linkedClass = p_ctor.prototype;
        }

        if (!this.$name || !linkedClass.$name) {
            log.error("Could not link property '" + p + "'. At least one participating " +
                      "class misses the $name property.", this, linkedClass);
            return;
        } else if (!linkedClass.$schema) {
            log.error("Could not associate " + this.$name + " and " +
                linkedClass.$name + " via property '" + p + "'. No schema " +
                "defined in " + linkedClass.$name + ".");
            return;
        } else if (!linkedClass.$schema.hasOwnProperty(p_inverse)) {
            log.error("Could not associate " + this.$name + " and " +
                      linkedClass.$name + " via property '" + p + "'. " +
                      linkedClass.$name + " has no property '" + p_inverse +
                      "'.");
            return;
        }

        // "left" is this (= source of directed association);
        p_type_left  = property.get("type");
        p_type_right = linkedClass.$schema[p_inverse].type;

        // Create association. Kind of association derived from the 'type'
        // configuration on both sides of the linked properties.
        assoc = new Association({
            source: {
                name: p,
                type: p_type_left,
                dtype: this.constructor,
            },
            target: {
                name: p_inverse,
                type: p_type_right,
                dtype: p_ctor
            }
        });

        // make associations available for all instances of the same type
        if (! this.constructor.prototype.hasOwnProperty("$associations")) {
            this.constructor.prototype.$associations = new ArraySet({
                keyFn: Entity.getId
            });
        }
        this.constructor.prototype.$associations.add(assoc);
    }

    /**
     * Creates a plain JavaScript object based on the model schema. If 'opts'
     * specifies an HTTP method, then it will be compared against the 'scenario'
     * declared for a schema property object. If they match, the property will be
     * serialized.
     * If there's no 'scenario' declaration in the schema, then the model property
     * will be rendered for all methods. Likewise if no particular scenario is
     * specified in the serialization options.
     *
     * Example:
     * ```javascript
     * declare([], { // MyModel
     *      schema: {
     *           propertyA: {default: "always"},
     *           propertyB: {default: "always", scenario: "GET,POST,PUT"},
     *           propertyC: {default: "read-only", scenario: "GET" },
     *           propertyD: {default: "write-only", scenario: "POST,PUT"},
     *           propertyE: {default: "never", scenario: "NONE"}
     *      }
     * });
     * ```
     * Running serialize.call(this, {scenario: "POST"}); will produce
     * ```javascript
     * {
     *     propertyA: "always",
     *     propertyB: "always",
     *     propertyD: "write-only"
     * }
     * ```
     * @param {object} o The object to serialize
     * @param {object} schema The schema to evaluate
     * @param {object} opts Serialization options (TODO: document)
     */
    function serialize(opts) {
        // MAX_DEPTH: vital to prevent infinite loops due to circular references.
        // There shouldn't be many real world use cases with object hierarchies
        // deeper than MAX_DEPTH. If stakeholders have diverging requirements
        // the value specified might be increased reasonably;
        // currentDepth initialized with -2 because we get
        //   -1 when entering _serialize initially (doing type selection, only)
        //    0 when type handler calls _serialize on each property/item on the
        //    first level
        var MAX_DEPTH = this.SERIALIZE_DEPTH_MAXIMUM,
            that = this,
            result = this,
            currentDepth = 0,
            finalDepth = 0,
            serializeAll = false, // serialize all schema props...
            tmp;

        function _serializeValue(v) {
            currentDepth += 1;
            tmp = v;
            if (currentDepth > opts.serializeDepth) {
                finalDepth = currentDepth;
            }
            if (type.isArray(v)) {
                tmp = _serializeArray(v);
            } else if (type.isObject(v)) {
                if (type.isFunction(v.isInstanceOf)) {
                    if (v.isInstanceOf(Model) && type.isObject(v.$schema)) {
                        tmp = _serializeModel(v);
                    } else {
                        tmp = _serializeObject(v);
                    }
                } else {
                    tmp = _serializeObject(v);
                }
            } // else: v = function, undefined, NaN, Infinity, ...
            currentDepth -= 1;
            return tmp;
        }

        function _serializeObject(o) {
            if (currentDepth > opts.serializeDepth) { return getId(o); }
            var p,
                plain = {};
            for (p in o) {
                if (p.indexOf("_") !== 0) {
                    plain[p] = _serializeValue(o[p]); // only serialize "public" properties
                }
            }
            return plain;
        }

        function _serializeArray(a) {
            if (currentDepth > opts.serializeDepth) { return getId(a); } // return array of IDs
            var value,
                plain = [],
                i = 0,
                iLen = a.length;
            for (i = 0; i < iLen; i += 1) {
                currentDepth -=1;
                plain[i] = _serializeValue(a[i]);
                currentDepth +=1;
            }
            return plain;
        }

        function _serializeModel(model) {
            if (currentDepth > opts.serializeDepth) { return getId(model); }
            var plain = {},
                p = "",
                p_alias = null,
                p_scenario = "",
                p_formatter = null,
                p_formatted = "",
                tmp = null,
                schema = model.$schema;
            for (p in schema) {
                if (schema.hasOwnProperty(p) && model.hasOwnProperty(p)) {
                    p_scenario = schema[p].get("scenario");
                    if (forceSerializeAll || p_scenario.indexOf("*") >= 0 || opts.scenario === p_scenario) {
                        p_alias = schema[p].get("plain");
                        p_formatter = schema[p].get("formatter");
                        if (p_alias === "") {
                            continue;    // an empty alias is equivalent to "never (de-)serialize"
                        } else if (!p_alias) {
                            p_alias = p; // schema property name assumed to be used on plain obj, too.
                        }
                        if (type.isFunction(p_formatter)) {
                            // formatter property config is a function
                            p_formatted = p_formatter.call(that, p, model[p]);
                        } else if (type.isFunction(model[p_formatter])) {
                            // formatter property config refers to a method on the entity
                            p_formatted = model[p_formatter].call(that, p, model[p]);
                        } else if (model.property(p).hasFlag("FK")) {
                            // "FK" flag forces formatting to id.
                            plain[p_alias] = getId(model[p]);
                            continue;
                        } else {
                            p_formatted = model[p];
                        }
                        plain[p_alias] = _serializeValue(p_formatted);
                    }
                }
            }
            return plain;
        }

        opts = defaults(opts, {
            scenario: "*",
            serializeDepth: function(given) {
                return given >= 0 && given <= MAX_DEPTH ? given : MAX_DEPTH;
            }
        });
        forceSerializeAll = opts.scenario.indexOf("*") >= 0;
        result = _serializeValue(that);
        if (finalDepth >= MAX_DEPTH) {
            log.warn("serialize(): Stopped after " + (finalDepth-1) + " cycles. Do you have circular references?");
        }
        return result;
    }

    /**
     * Maps properties 'p' from source 'src' into target 't' using rules defined
     * in a schema 's' where s describes a type 'T'. The mapping process is
     * called "deserialization". Basically deserialization is a mapping of a
     * plain javascript object onto a javascript object created with a
     * constructor T. The mapping is part of the constructor logic of any T
     * derived from Model, and it is performed whenever we write something like
     * ```javascript
     *     var t = new T(src);
     * // or
     *     var manager = new EntityManager();
     *     var t = manager.create(T, src);
     * ```
     * Deserialization may be a (controlled) recursive process if an instance
     * of T is created from a plain nested object 'src' and the schema s of T
     * denotes e.g. a property "p", as being of type C whereas C was also derived
     * from Model.
     *
     * Example:
     * ```javascript
     *     // Data type definition for T
     *     var T = declare([Model], {
     *         schema: {
     *             "p": {dtype: C}
     *         }
     *     });
     *     // Instance data
     *     src = {...
     *        "p": {
     *           "p_1": ... ,
     *           "p_2": ... ,
     *           "p_3": ... ,
     *        }
     *     }
     *     // Instantiation: deserialize src into an instance t of type T
     *     var t = manager.create(T, src);
     * ```
     * If the deserializer reaches src[p="p"] it will assume from the schema of
     * T that src[p="p"] is to be instantiated as instance of C. So it processes
     * a statement
     * ```javascript
     * t["p"] = manager.create(C, src[p="p"]);
     * ```
     * which is where we enter recursion by deserializing src["p"]. The example
     * shows that the number of recursions not only depends on the structure of
     * the input data but also on its schematic description.
     */
    function deserialize(src, opts) {
        var target = this,
            schema = target.$schema,
            p, p_obj, p_src, p_src_names, p_src_value, p_alias, p_type, p_ctor, p_scenario, p_parser, p_flags,
            i, iLen,
            j, jLen,
            tmp;

        if (!type.isObject(src) || !type.isObject(schema)) {
            return;
        }
        opts = defaults(opts, { scenario: "*" });
        p_src_names = Object.getOwnPropertyNames(src);
        for (i = 0, iLen = p_src_names.length; i < iLen; i += 1) {
            p_src = p_src_names[i];
            p = this.$aliases[p_src] || p_src; // Get schema property name for plain property name
            if (schema.hasOwnProperty(p)) {
                // evaluate 'scenario' config property
                p_obj       = schema[p];
                p_scenario  = p_obj.get("scenario") || "*";
                if (!(opts.scenario.indexOf("*") >= 0 || p_scenario.indexOf("*") >= 0 || opts.scenario === p_scenario)) {
                    continue;
                }
                p_type      = p_obj.get("type") || "any";
                p_parser    = p_obj.get("parser");
                p_ctor      = p_obj.get("dtype");
                p_src_value = src[p_src];

                if (! type.isDefined(p_src_value)) {
                    p_src_value = schema[p].get("default");
                }

                // evaluate 'parser' config property
                if (type.isFunction(p_parser)) {
                    p_src_value = p_parser.call(target, p_src_value);
                } else if (type.isFunction(target[p_parser])) {
                    p_src_value = target[p_parser].call(target, p_src_value);
                }

                // coerce array
                if (p_type === "array" && !type.isArray(p_src_value)) {
                    log.warn("deserialize(): Property '" + p + "': plain value does not match type declared in schema. Coerced array from ", p_src_value);
                    p_src_value = [p_src_value];
                }

                // instantiate related objects
                if (type.isFunction(p_ctor)) {
                    // We've got a constructor assigned to the 'dtype' property config.
                    // Next we determine whether we need to create a single instance
                    // or an array of instances. If there's a 'type' property
                    // config, then: if 'type' config is a skalar but p_src_value is an
                    // array, then we create a single instance and pass p_src_value
                    // to the constructor. If 'type' is "array" but p_src_value is
                    // a skalar, we create an array with p_src_value as item.
                    // If there's no 'type' we derive the type from p_src_value.
                    if(!p_type || p_type === "any") {
                        if (type.isArray(p_src_value)) {
                            p_type = "array";
                        }
                    }

                    // We instantiate a plain object using entityManager.create()
                    // such that no two instances of the same entity type
                    // (dtype) with the same Id will be created more than once.
                    // Note that we can also instantiate non-entities this way.
                    // If they aren't 'identifiable' entityManager.create() just
                    // invokes p_ctor with the new operator.
                    // Be aware that in case of `p_ctor` referring to another
                    // model constructor, instantiation of `p_ctor` results
                    // in a nested (recursive) call to deserialize(). The
                    // depth up to which we recurse, depends on the data we
                    // deserialize and the corresponding schema(s).
                    if (p_type !== "array") {
                        if (p_src_value && !type.isInstanceOf(Entity, p_src_value)) {
                            if (this.$entityManager) {
                                p_src_value = this.$entityManager.create(p_ctor, p_src_value);
                            } else {
                                p_src_value = new p_ctor(p_src_value);
                            }
                        } // else: p_src_value is already an entity.
                    } else {
                        tmp = this.$entityManager.createCollection(p_ctor);
                        jLen = p_src_value.length;
                        for (j = 0; j < jLen; j += 1) {
                            tmp.add(p_src_value[j]);
                        }
                        p_src_value = tmp;
                    }
                }

                // Set value on target
                if (type.isDefined(p_src_value)) {
                    target[p] = p_src_value;
                } else {
                    target[p] = p_obj.get("default");
                }

                // Flags 'seal' and 'freeze' possible?
                /*
                if (p_obj.hasFlag("seal") >= 0 && type.isFunction(Object.seal)) {
                    target[p] = Object.seal(target[p]);
                }
                if (p_obj.hasFlag("freeze") >= 0 && type.isFunction(Object.freeze)) {
                    target[p] = Object.freeze(target[p]);
                }*/
            } else if (! p.charAt(0).match(/_|\$/) && src.hasOwnProperty(p)) {
                // Do also copy non-schema properties, but
                // not those who start with _ or $
                if (target[p] !== src[p]) {
                    target.set(p, lang.clone(src[p]));
                }
            }
        }
        return target;
    }



    // helper to work with promiseAll and to make it resolve
    // if no promises get pushed to its array.
    function getPromise(promises) {
        if (promises && promises.length > 0) {
            return promiseAll(promises);
        } else {
            var def = new Deferred();
            def.resolve();
            return def.promise;
        }
    }

    // helper. Default handler for promise-reject-branch
    function onError(err) {
        throw err;
    }

    /**
     * Returns the changes stream which clients can subscribe to in order to
     * get notified about changes to any model instance.
     * @method data/Model.changes
     * @return Rx.Subject
     * @tutorial reactivity
     */
    Model.changes = function() {
        return Model.prototype._changesStream;
    };

    return Model;
});
