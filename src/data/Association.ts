"use strict";
import * as aspect from "dojo/aspect";
import {shared} from "../lang/typescript";
import {ArraySet, EntitySet} from "../collection/collection";
import {type, Log} from "../util/util";
import {ID, ID_PROPERTY} from "./Identity";
import {Entity} from "./Entity";

var log = Log.getLogger("data/Association");

interface AssociationNode {
    /** Field name **/
    name: string;
    /** Simple field type **/
    type: string;
    /** source/target entity type constructor **/
    ctor: Function;
    /** Name of the entity type which the field belongs to **/
    className: string;
}

/**
 * Associations are implemented as directed edges between two entities
 * where source and target are fields on entities. Like [[Field]]s and
 * [[OwnFields]] there are Associations and [[OwnAssociation]]s. Associations
 * represent type level information, describing how two entity types are
 * related. OwnAssociations are more like links on the instance level. They
 * bind related instances and their linked fields to keep those fields
 * in sync. An Association thereby serves as metadata to OwnAssociations.
 * An OwnAssociation is owned by the entity instance which is at the source
 * end of the edge.
 *
 * Applications are not advised to interact with this class, directly.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 *
 */
export class Association {

    /**
     * Kind of one-to-one association
     * @const
     */
    @shared(0) I_I:number;

    /**
     * Kind of one-to-many association
     * @const
     */
    @shared(1) I_N:number;

    /**
     * Kind of many-to-one association
     * @const
     */
    @shared(2) N_I:number;

    /**
     * Kind of many-to-many association
     * @const
     */
    @shared(3) M_N:number;

    /**
     * Association identifier. Follows scheme `sourceEntityName:sourceFieldName:targetEntityName:targetFieldName`
     */
    id:string|number = null;

    /**
     * Cardinality. See constants.
     */
    kind:number = null;

    /**
     * Descriptor for source field name, type and dtype.
     */
    source: AssociationNode;

    /**
     * Descriptor for target field name, type and dtype.
     */
    target: AssociationNode;

    /**
     * @param {object} props The fields to mix into the instance.
     */
    constructor(props: {source: AssociationNode, target: AssociationNode}) {
        Object.assign(this, props);
        this.id = this.source.className + ":" + this.source.name + ":" +
                  this.target.className + ":" + this.target.name;

        if (this.source.type === "array" && this.target.type !== "array") {
            this.kind = this.I_N;
        } else if (this.source.type !== "array" && this.target.type === "array") {
            this.kind = this.N_I;
        } else if (this.source.type === "array" && this.target.type === "array") {
            this.kind = this.M_N;
        } else {
            this.kind = this.I_I;
        }
    }

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
    getOwnAssociation (owningModel) {

        // Derive an OwnAssociation from this Association.
        var ownAssociation = new OwnAssociation(owningModel, this);

        // setup observers to listen for changes on the source field
        // in order to propagate them to the target field.
        ownAssociation.bind();
        return ownAssociation;
    }

    /**
     * Propagates removal of a given entity along this association.
     * Its deletion will be propagated to the target ("right end"). It sets
     * references to source held by target to NULL.
     *
     * @param {data/Entity} entity The entity to remove, which is
     * considered to be at the source end ("left end") of the directed
     * association.
     */
    remove (entity) {
        var that = this,
            srcFieldName = this.source.name,
            srcPropValue = entity.get(srcFieldName),
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
                var targetFieldName = that.target.name;
                idx = other[targetFieldName].indexOf(entity);
                removed = other[targetFieldName].splice(idx, 1);
                // TODO call remove() on removed entity?
            });
        }
    }

    /**
     * Destroy the association. Note that OwnAssociations which refer to
     * this association via their `metadata` property won't be destroyed
     * when this method is invoked.
     */
    destroy() {
        // TODO
    }
};

/**
 *
 * OwnAssociation instances represent associations on the instance level,
 * that is, while an [[Association]] holds meta information
 * about model types and their kind of relationship, an **owned Association**
 * realises an association on the model instance level. It binds two fields
 * on either side of related model **instances** to keep the instances in sync.
 * Like Associations, OwnAssociations are directed, so they establish a
 * one-way binding and are owned by the model instance at the source end of
 * it. Whenever you define an *inverse* for a data field, the corresponding
 * OwnAssociation in the opposite direction will be created, too.
 *
 * The concept of Association vs. OwnAssociation is similar to JavaScript's
 * prototype property vs. own property concept. In fact, we would have set
 * the association instances on the prototype of all of their corresponding
 * OwnAssociation instances (using delegation pattern [Crockford]), if
 * modifying the prototype of JavaScript objects wouldn't be quite costly.
 * For performance reasons any OwnAssociation holds a reference to its
 * meta association via the `metadata` property instead.
 *
 * @param {data/Association} metaAssoc The association on the type level
 * @param {data/Model} owner The model instance at the source end of the directed association
 * @private
 */
export class OwnAssociation {

    private _sourceRefs:any = {};
    private _sourceInstance = null;
    private _sourceIdObserver = null;
    private _sourceFieldObserver = null;
    private _pendingUpdate = 0;
    metadata = null;

    constructor(owner, metaAssoc) {
        this.metadata = metaAssoc;
        this._sourceInstance = owner;
        this._pendingUpdate = 0;
        // Memory: Destroy owned association if owner is destroyed.
        aspect.after(owner, "destroy", () => this.destroy());
    }
    /**
     * This method implements the logic update a target field at
     * the end of the association upon a change to the field at the
     * source end of the association.
     *
     * Imagine there is a Model type *Person* with an array
     * field `pets`. Each *Pet* instance has a field `owner` which
     * points to the Person instance which owns it.
     *
     * ```
     * |      Person       |            |       Pet       |
     * +-------------------+            +-----------------+
     * |+ pets:Array<Pet>  | -1-----n-> |+ owner:Person   | (inverse)
     * ```
     *
     * On the side of a Person the following changes might happen:
     *
     * - a pet is added to the `pets` array of the Person instance:
     * the field `owner` of the added Pet must be updated such that it points to its owning person.
     * - a pet is removed from an owner's `pets` array:
     * the reference held in the owner field of the pet should be removed.
     *
     * On the side of a Pet the following changes might happen:
     *
     * - a pets `owner` has been set (and was `null`, previously):
     * the pet must be added to the owner's `pets` array.
     * - the owner is removed (NULLed):
     * the pet must be removed from the owners `pets` array.
     * - a pets `owner` is overwritten with a new owner:
     * the pet must be removed from the old owner's `pets` array and must be
     * added the pet to the new owner's `pets` array.
     *
     * @param {object} sourceEntity The entity from which an own association (edge) originates
     * @param {object} change A change record describing the change which happend to the source entity's field which is bound to this association.
     * @param {string} targetFieldName The name of the inverse field of the target entity.
     */
    private updateInverse (sourceEntity, change, targetFieldName) {
        var index, object, addedCount, changed, removed, added, addedItems, i, iMax,
            targetValue, j, jMax, indexOf, removedItem, idx,
            oldValue, newValue, buffer = [];

        if (change.type === "splice") {
            // observed field's value is an array. 1:n or n:m association...
            // update to elements in the collection
            index       = change.index;
            object      = change.object;
            addedCount  = change.addedCount;
            removed     = change.removed;
            if (addedCount > 0) {
                addedItems = object.slice(index, index + addedCount);
                for (i = 0, iMax = addedItems.length; i < iMax; i += 1) {
                    targetValue = addedItems[i][targetFieldName];
                    if (type.isArray(targetValue)) {
                        for(j = 0, jMax = targetValue.length, indexOf = -1; j < jMax; j += 1) {
                            if (targetValue[j] === sourceEntity) {
                                indexOf = j;
                                break;
                            }
                        }
                        if (indexOf < 0) {
                            targetValue.push(sourceEntity);
                        }
                    } else {
                        addedItems[i][targetFieldName] = sourceEntity;
                    }
                }
            }
            if (removed.length > 0) {
                iMax = removed.length;
                for (i = 0; i < iMax; i += 1) {
                    removedItem = removed[i];
                    if (type.isObject(removedItem)) {
                        targetValue = removedItem[targetFieldName];
                        // FIXME: When array A[1,2] is overwritten with B[1,2],
                        // then removing any references from 1,2 in A does
                        // of course affect 1,2 in B since they are one and the
                        // same entity. Hence, when new and old value are
                        // arrays we actually just need to remove references on
                        // the junction set that has been in A but does no
                        // longer exist in B.

                        if (type.isArray(targetValue)) {
                            idx = targetValue.indexOf(sourceEntity);
                            if (idx >= 0) {
                                 targetValue.splice(idx, 1);
                            }
                        } else {
                            removedItem[targetFieldName] = null;
                        }
                    }
                }
            }
        } else if (change.type === "update") {
            // Update was caused by reassignment. Old value of an entity
            // field has been overwritten with a new value.
            changed  =  change.object;
            oldValue = change.oldValue;
            newValue = change.object[change.name];
            removed  = this.getDiff(oldValue, newValue);
            added    = this.getDiff(newValue, oldValue);
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
                }, targetFieldName);
            }
            if (added.length > 0) {
                this.updateInverse(sourceEntity, {
                    type: "splice",
                    object: added,
                    addedCount: added.length,
                    index: 0,
                    removed: []
                }, targetFieldName);
            }
        }
    }

    /**
     * Binds related fields on the instance level such that changes to
     * the field at the source end of a directed association get reflected
     * on the association target (inverse field).
     */
    bind() {
        var that = this,
            sourceEntity   = this._sourceInstance,
            sourceFieldName = this.metadata.source.name,
            targetFieldName = this.metadata.target.name,
            pendingUpdate = false;

        if (!(sourceFieldName && targetFieldName)) {
            log.error("Can't bind association. Source and/or target field missing.");
            return;
        }

        this._sourceIdObserver = sourceEntity.field(ID_PROPERTY(sourceEntity)).changes().subscribe(function(change) {
            // Track changes to the ID property (esp. after POST-Requests when the initial ID is assigned)
            if (change.type === "update" && change.newValue) {
                that._sourceRefs.id = ID(sourceEntity);
                that._sourceIdObserver.dispose();
            }
        });

        this._sourceFieldObserver = sourceEntity.field(sourceFieldName).changes().subscribe(function(change) {
            // Subscribe for changes in order to sync associated fields.
            // Prevent cycles which would occur when an update propagates
            // from source to inverse and back, using a "pendingUpdate"
            // flag. TODO: Are there 2 cycles until reflexive updates stabilize?
            if (that._pendingUpdate < 1) {
                that._pendingUpdate += 1;
                that.updateInverse(sourceEntity, change, targetFieldName);
                that._pendingUpdate -= 1;
            }
        });
    }



    unbind() {
        delete this._sourceRefs[ID(this._sourceInstance)];
        this._sourceIdObserver.dispose();
        this._sourceFieldObserver.dispose();
    }

    destroy() {
        this.unbind();
    }

    /**
     * Determines which of the entities in `a1` are not in `a2`.
     *
     * @param {object|data/collection/EntitySet} a1
     * @param {object|data/collection/EntitySet} a2
     */
    private getDiff(a1, a2) {
        var tmp, value, oldValues, refValues, diff = [];
        if (!a1) {
            return []; // nothing
        }
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
            if (!a2.value(ID(value))) {
                diff.push(value);
            }
        }
        return diff;
    }
};
