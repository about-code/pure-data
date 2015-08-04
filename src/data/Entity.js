/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @description
 * This component may be used as a mixin or base class for types which represent
 * entities. Note that business entities should be derived from {@link data/Model}
 * and therefore will indirectly inhert from this class.
 *
 * The class may be useful to components which have an identity and should only
 * be instantiated once per id but which do not necessarily need the full modeling
 * capabilities and data access logic provided by {@link data/Model}.
 *
 * @constructor data/Entity
 * @param {string|number|object} data An entity identifier (string or number) or
 * entity data (object) to mix into the instance.
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "../Destroyable",
    "../util/type",
    "../util/log!data/Entity"
], function(declare, lang, Destroyable, type, log) {
    //"use strict";

    var Entity = declare([Destroyable], /**@lends data/Entity.prototype*/{

        /**
         * Flag which marks an entity as removed. The entity instance might still
         * live in memory until changes are saved.
         */
        $removed: false,

        /**
         * Name of the id property on plain entity data
         * @type {string}
         */
        $idProperty: "id",

        /**
         * A entitymanager holds entity instances of entity types and guarantees
         * that for each type there's only a single instance with a particular
         * identity. It is similar to the concept of a *Store*. Key differences
         * are
         * - it manages entities of multiple entity types / models whereas
         * stores only hold entities of a particular entity type
         * - it does not provide a convenient query API but only a simple lookup
         * for a particular entity.
         */
        $entityManager: null,

        constructor: function(data, entityManager) {
            if (type.isPrimitive(data)) {
                this.set("id", data); // assume primitive 'data' to be an ID
            } else if (type.isObject(data)) {
                this.set("id", data[this.$idProperty]);
            }
            if (entityManager) {
                this.attach(entityManager);
            }
        },

        init: function(data, entityManager) {
            if (entityManager) {
                this.attach(entityManager);
            }
        },

        /**
         * This will attach an entity to a different entity manager. Be aware
         * that the operation doesn't affect related entities which may have
         * previously been instantiated in the same entity manager context like
         * the entity whose entity manager context is being changed.
         */
        attach: function(entityManager) {
            if (this.$entityManager !== entityManager) {
                if (this.$entityManager) {
                    this.$entityManager.detach(this);
                }
                entityManager.attach(this);
            }
        },

        merge: function(data) {
            lang.mixin(this, data);
        },

        /**
         * @param {string} propName
         * @param {*} newValue
         */
        set: function(propName, newValue) {
            var oldValue = this[propName],
                instance,
                em;

            if (oldValue !== newValue) {
                if (propName === "id" && this.$entityManager) {
                    em = this.$entityManager;
                    // note that detaching will set this.$entityManager to null
                    // the entity becomes temporarily unmanaged. Therefore hold
                    // em-instance in a temporary variable.
                    em.detach(this);
                    em.attach(this, em);
                    this.id = newValue;
                    //this[propName] = newValue; // TODO: why do tests fail when placing it in between detach/attach? New ID should already be set when attaching!!
                } else {
                    this[propName] = newValue;
                }
            }
            //return this.inherited(arguments);
        },

        /**
         * @param {string} propName
         * @return {*}
         */
        get: function(propName) {
            return this[propName];
            //return this._get(propName, this._getAttrNames(propName));
        },

        remove: function() {
            this.$removed = true;
        },

        destroy: function() {
            if (this.$entityManager) {
                this.$entityManager.detach(this);
            }
        }
    });

    Entity.getId = function(value) {
        if (type.isPrimitive(value)) {
            return value;
        } else if (type.isObject(value)) {
            return value.id;
        } else {
            return value;
        }
    };

    return Entity;
});
