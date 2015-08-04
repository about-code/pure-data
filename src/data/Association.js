/**
 * End users are not advised to interact with the class, directly. It
 * implements internals which data modelers should not need to care about.
 * For an end-user documentation see [Modeling Data](./tutorial-modeling-data.html).
 *
 * From a technical perspective, associations are implemented as directed
 * edges between two entities where source and target are properties on entities.
 * Like [Properties](./Property.html) and [OwnProperties](./OwnProperty.html) there
 * are [Associations](./Association.html) and [OwnAssociations](./OwnAssociation.html). Associations
 * represent type level information, describing how two entity types are
 * related. OwnAssociations are more like links on the instance level. They
 * bind related instances and their linked properties to keep those properties
 * in sync. An Association thereby serves as metadata to OwnAssociations. An
 * OwnAssociation is owned by the entity instance which is at the source end of
 * the edge.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @constructor data/Association
 * @param {object} props The properties to mix into the instance.
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/aspect",
    "./Entity",
    "../collection/EntitySet",
    "../collection/ArraySet",
    "../util/dtype",
    "../util/log!data/Association"
], function(declare, lang, aspect, Entity, EntitySet, ArraySet, type, log) {

    // -- public interface --

    var OwnAssociation,
        Association = declare([], /** @lends data/Association.prototype */{

        /**
         * Kind of one-to-one association
         * @const
         * @property {integer}
         */
        I_I: 0,
        /**
         * Kind of one-to-many association
         * @const
         * @property {integer}
         */
        I_N: 1,
        /**
         * Kind of many-to-one association
         * @const
         * @property {integer}
         */
        N_I: 2,
        /**
         * Kind of many-to-many association
         * @const
         * @property {integer}
         */
        M_N: 3,

        /**
         * Association identifier. Follows scheme `sourceEntityName:sourcePropName:targetEntityName:targetPropName`
         * @type{(string|integer)}
         */
        id: null,

        /**
         * Cardinality. See constants.
         * @type {integer}
         */
        kind: null,

        /**
         * Descriptor for source property name, type and dtype.
         * @type {object}
         * @see data/Property
         */
        source: {
            /** @property {string} name Source property name **/
            name: null,
            /** @property {string} type Source simple type **/
            type: null,
            /** @property {function} dtype Source entity type constructor **/
            dtype: null,
            /** @property {string} $name Source entity type name (= `source.dtype.prototype.$name`) **/
            $name: null
        },

        /**
         * Descriptor for target property name, type and dtype.
         * @type {object}
         * @see data/Property
         */
        target: {
            name: null,
            type: null,
            dtype: null,
            $name: null,
        },

        constructor: function(props) {
            lang.mixin(this, props);
            this.source.$name = this.source.dtype.prototype.$name;
            this.target.$name = this.target.dtype.prototype.$name;
            this.id = this.source.$name + ":" + this.source.name + ":" +
                      this.target.$name + ":" + this.target.name;

            if (this.source.type === "array" && this.target.type !== "array") {
                this.kind = this.I_N;
            } else if (this.source.type !== "array" && this.target.type === "array") {
                this.kind = this.N_I;
            } else if (this.source.type === "array" && this.target.type === "array") {
                this.kind = this.M_N;
            } else {
                this.kind = this.I_I;
            }
        },

        /**
         * Think of Associations versus OwnAssociations as associations on the type
         * level versus associations on the instance level. For each association
         * on the type level there may exist many associations on the instance level.
         * While the first are representations of the relationship metadata, the
         * latter realise a binding such that changes to either side of the
         * relationship propagate among related entity instances.
         *
         * Associations are directed. Each association , only the instance on the source end
         * of an association will be bound. The target will be bound to the
         * source end of the inverse Association.
         *
         * @param {data/Model} model The model instance owning the association.
         * @return {data/OwnAssociation}
         */
        getOwnAssociation: function (owningModel) {

            // Derive an OwnAssociation from this Association.
            var ownAssociation = new OwnAssociation(owningModel, this);

            // setup observers to listen for changes on the source end property
            // in order to propagate them to the target end property.
            ownAssociation.bind();
            return ownAssociation;
        },

        /**
         * Propagates removal of a given entity along this association.
         * Its deletion will be propagated to the target ("right end"). It sets
         * references to source held by target to NULL.
         *
         * @param {data/Entity} entity The entity to remove, which is
         * considered to be at the source end ("left end") of the directed
         * association.
         */
        remove: function (entity) {
            var that = this,
                srcPropName = this.source.name,
                srcPropValue = entity.get(srcPropName),
                targetPropValue,
                idx,
                removed;

            if (!srcPropValue) {
                return;
            }
            if (this.kind === this.I_I) {
                srcPropValue.set(this.target.name, null);
            } else if (this.kind === this.I_N) {
                // one of 'entity' has n others; Each of others refers to 'entity'.
                // Visit others and remove their reference to entity.
                srcPropValue.forEach(function(other) {
                    other.set(that.target.name, null);
                });
            } else if (this.kind === this.N_I) {
                // n of entity are referenced by other. Visit other's array of
                // references and remove reference to entity.
                targetPropValue = srcPropValue.get(this.target.name);
                idx = targetPropValue.indexOf(entity);
                removed = targetPropValue.splice(idx, 1);
                // TODO call remove() on removed entity?
            } else if (this.kind === this.M_N) {
                // one on the left has n references to others on the right who
                // all reference n of the left
                srcPropValue.forEach(function(other) {
                    var targetPropName = that.target.name;
                    idx = other[targetPropName].indexOf(entity);
                    removed = other[targetPropName].splice(idx, 1);
                    // TODO call remove() on removed entity?
                });
            }
        },

        /**
         * Destroy the association. Note that OwnAssociations which refer to
         * this association via their `metadata` property won't be destroyed
         * when this method is invoked.
         */
        destroy: function() {
            this.inherited(arguments);
        }
    });

    /**
     * @description
     * OwnAssociation instances represent associations on the instance level,
     * that is, while an {@link data/Association|Association} holds meta information
     * about model types and their kind of relationship, an **owned Association**
     * realises an association on the model instance level. It binds two properties
     * on either side of related model **instances** to keep the instances in sync.
     * Like Associations, OwnAssociations are directed, so they establish a
     * one-way binding and are owned by the model instance at the source end of
     * it. Whenever you define an *inverse* property in the {@link data/Model|Model}
     * schema, the corresponding OwnAssociation in the opposite direction will be
     * created, too.
     *
     * The concept of Association vs. OwnAssociation is similar to JavaScript's
     * prototype property vs. own property concept. In fact, we would have set
     * the association instances on the prototype of all of their corresponding
     * OwnAssociation instances (using delegation pattern [Crockford]), if
     * modifying the prototype of JavaScript objects wouldn't be quite costly.
     * For performance reasons any OwnAssociation holds a reference to its
     * meta association via the `metadata` property instead.
     *
     * @constructor data/OwnAssociation
     * @param {data/Association} metaAssoc The association on the type level
     * @param {data/Model} owner The model instance at the source end of the directed association
     * @private
     */
    OwnAssociation = declare([], /** @lends data/OwnAssociation.prototype */ {

        _sourceRefs: {},
        _sourceInstance: null,
        _sourceIdObserver: null,
        _sourcePropertyObserver: null,
        metadata: null,

        constructor: function(owner, metaAssoc) {
            this.metadata = metaAssoc;
            this._sourceInstance = owner;
            this._pendingUpdate = 0;
            // Memory: Destroy owned association if owner is destroyed.
            aspect.after(owner, 'destroy', lang.hitch(this, this.destroy));
        },
        /**
         * This method is an observer for properties that participate in an
         * association. Imagine there is a Model type **Person** and the observed
         * property is `pets`. Then if a pet is added to the `pets` array of a
         * Person instance, we want to update the inverse property `owner` of the
         * added Pet instance, such that it points to its owning person.
         * `updateInverse()` implements the binding logic to sync the two related
         * model instances.
         *
         * ```
         * |      Person       |            |       Pet       |
         * +-------------------+            +-----------------+
         * |+ pets:Array<Pet>  | -1-----n-> |+ owner:Person   | (inverse)
         * ```
         * @param {object} sourceEntity E.g. a reference to the `pets` array.
         * @param {object} change An ES7 object-observe-compatible change record
         * @param {string} inverseName The name of the inverse property (e.g. `"owner"`)
         */
        updateInverse: function (sourceEntity, change, inverseName) {
            var index, object, addedCount, removed, addedItems, i, iMax,
                inverseValue, j, jMax, indexOf, removedItem, idx,
                oldValue, newValue, buffer = [];

            if (change.type === "splice") {
                // observed property's value is an array. 1:n or n:m association...
                // update to elements in the collection
                index       = change.index;
                object      = change.object;
                addedCount  = change.addedCount;
                removed     = change.removed;
                if (addedCount > 0) {
                    addedItems = object.slice(index, index + addedCount);
                    for (i = 0, iMax = addedItems.length; i < iMax; i += 1) {
                        inverseValue = addedItems[i][inverseName];
                        if (type.isArray(inverseValue)) {
                            // |         Parent          |            |         Child         |
                            // +-------------------------+            +-----------------------+
                            // |+ children:Array<Child>  | --n----m-> |+ childOf:Array<Parent>| (inverse)
                            for(j = 0, jMax = inverseValue.length, indexOf = -1; j < jMax; j += 1) {
                                if (inverseValue[j] === sourceEntity) {
                                    indexOf = j;
                                    break;
                                }
                            }
                            if (indexOf < 0) {
                                inverseValue.push(sourceEntity);
                            }
                        } else {
                            // |         Parent          |            |         Child         |
                            // +-------------------------+            +-----------------------+
                            // |+ children:Array<Child>  | --1----n-> |+ childOf:Parent       | (inverse)
                            addedItems[i][inverseName] = sourceEntity;
                        }
                    }
                }
                if (removed.length > 0) {
                    iMax = removed.length;
                    for (i = 0; i < iMax; i += 1) {
                        removedItem = removed[i];
                        if (type.isObject(removedItem)) {
                            inverseValue = removedItem[inverseName];
                            // FIXME: When array A[1,2] is overwritten with B[1,2],
                            // then removing any references from 1,2 in A does
                            // of course affect 1,2 in B since they are one and the
                            // same entity. Hence, when new and old value are
                            // arrays we actually just need to remove references on
                            // the junction set that has been in A but does no
                            // longer exist in B.

                            if (type.isArray(inverseValue)) {
                                // |         Parent          |            |         Child         |
                                // +-------------------------+            +-----------------------+
                                // |+ children:Array<Child>  | --n----m-> |+ childOf:Array<Parent>| (inverse)
                                idx = inverseValue.indexOf(sourceEntity);
                                if (idx >= 0) {
                                     inverseValue.splice(idx, 1);
                                }
                            } else {
                                // |         Parent          |            |         Child         |
                                // +-------------------------+            +-----------------------+
                                // |+ children:Array<Child>  | --1----n-> |+ childOf:Parent       | (inverse)
                                removedItem[inverseName] = null;
                            }
                        }
                    }
                }
            } else if (change.type === "update") {
                // Update was caused by reassignment. Old value of an entity
                // property has been overwritten with a new value.
                changed  =  change.object;
                oldValue = change.oldValue;
                newValue = change.object[change.name];
                removed  = this._getDiff(oldValue, newValue);
                added    = this._getDiff(newValue, oldValue);
                if (oldValue === newValue) {
                    return;
                }
                if (removed.length > 0) {
                    this.updateInverse(sourceEntity, {
                        type: "splice",
                        object: [],
                        index: 0,
                        addedCount: 0,
                        removed: removed
                    }, inverseName);
                }
                if (added.length > 0) {
                    this.updateInverse(sourceEntity, {
                        type: "splice",
                        object: added,
                        addedCount: added.length,
                        index: 0,
                        removed: []
                    }, inverseName);
                }
            }
        },

        /**
         * Binds related properties on the instance level such that changes to
         * the property at the source end of a directed association get reflected
         * on the inverse.
         */
        bind: function() {
            var that = this,
                owner = this._sourceInstance,
                sourcePropName = this.metadata.source.name,
                targetPropName = this.metadata.target.name,
                pendingUpdate = false;

            if (!(sourcePropName && targetPropName)) {
                log.error("Can't bind association. Source and/or target property missing.");
                return;
            }

            this._sourceIdObserver = owner.property("id").changes().subscribe(function(change) {
                // Track changes to the ID property (esp. after POST-Requests when the initial ID is assigned)
                if (change.type === 'update' && change.newValue) {
                    that._sourceRefs[id] = that._sourceInstance.id;
                    that._sourceIdObserver.dispose();
                }
            });

            this._sourcePropertyObserver = owner.property(sourcePropName).changes().subscribe(function(change) {
                // Subscribe for changes in order to sync associated properties.
                // Prevent cycles which would occur when an update propagates
                // from source to inverse and back, using a "pendingUpdate"
                // flag. TODO: Are there 2 cycles until reflexive updates stabilize?
                if (that._pendingUpdate < 1) {
                    that._pendingUpdate += 1;
                    that.updateInverse(owner, change, targetPropName);
                    that._pendingUpdate -= 1;
                }
            });
        },

        unbind: function() {
            delete this._sourceRefs[this._sourceInstance.$id];
            this._sourceIdObserver.dispose();
            this._sourcePropertyObserver.dispose();
        },
        destroy: function() {
            this.unbind();
        },

        /**
         * Determines which of the entities in `a1` are not in `a2`.
         *
         * @param {object|data/collection/EntitySet} a1
         * @param {object|data/collection/EntitySet} a2
         */
        _getDiff: function(a1, a2) {
            var tmp, value, oldValues, diff = [];
            if (!a1)
                return []; // nothing
            if (!a2) {
                return type.isArray(a1) ? a1 : [a1]; // everything
            }
            if (!type.isInstanceOf(ArraySet, a1)) {
                tmp = a1;
                a1 = new ArraySet({keyFn: EntitySet.key});
                a1.push(tmp);
            }
            if (!type.isInstanceOf(ArraySet, a2)) {
                tmp = a2;
                a2 = new ArraySet({keyFn: EntitySet.key});
                a2.push(tmp);
            }
            refValues = a1.values();
            while((value = refValues.next())) {
                if (!a2.value(value.id)) {
                    diff.push(value);
                }
            }
            return diff;
        }
    });

    return Association;
});
