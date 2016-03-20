/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin.
 *
 * @extends collection/ArraySet
 * @param {object} opts Options:
 *

 */
"use strict";
import {ArraySet} from "pure/collection/ArraySet";
import {type} from "pure/util/type";
import {ID} from "pure/data/Identity";
import {Entity} from "pure/data/Entity";

export class EntitySet<T> extends ArraySet {

    private EntityTypeCtor = null;
    private context = null;

    /**
     * @param  {function} EntityTypeCtor Entity type constructor function
     * @param  {Object} opts
     * - **context: [[IContext]]** The context of the entities in this set.
     * - ...further options see [ArraySet](./ArraySet.html),
     */
    constructor(EntityTypeCtor:{new():T;}, opts?:{context?:IContext}) {
        super(opts);
		this.EntityTypeCtor = EntityTypeCtor;
		if (opts && opts.context) {
            this.context = opts.context;
        }
	}

    /**
     * The function to use for obtaining the Set-Key. May be overwritten by subclasses
     * or on particular instances.
     */
    key(value:any):number|string {
        return ID(value);
    }

	/**
	 * Adds/pushes a new entity instance to the EntitySet given that the set
	 * does not already contain another instance with the same entity
	 * identifier. Adding/pushing a primitive value or an object of a
	 * type other than specified via the constructor options will cause the
	 * method to create an entity instance. The given value is considered to
	 * be an entity identifier or entity data and thus is passed to the
	 * entity constructor. If an entity manager has been provided via the
	 * constructor options, then the manager is used to create the entity
	 * instance.
	 *
	 * @see [[Entity]]
	 * @see [[ArraySet]]
	 */
	push() {
		var i,
			iLen,
			value,
			Ctor = this.EntityTypeCtor,
			values = [];
		for (i = 0, iLen = arguments.length; i < iLen; i += 1) {
			value = arguments[i];
			if (!type.isInstanceOf(Ctor, value)) {
				if (this.context) {
					value = this.context.create(Ctor, value);
				} else if (Ctor) {
					value = new Ctor(value);
				}
			}
			values.push(value);
		}
		// Note: we don't run ArraySet.push one-by-one within the for-loop
		// because each push() would trigger change notification.
		// The tradeoff is having to iterate over all new elements twice -
		// here and in ArraySet.push().
		ArraySet.prototype.push.apply(this, values);
		return this.length;
	}

	/**
	 * Adds or removes entries from the entity set. See {@link #push}
	 * for how the method behaves when new entries are added.
	 */
	splice() {
		var index = arguments[0],
			args = [arguments[0], arguments[1]],
			oldLength = this.length,
			Ctor = this.EntityTypeCtor,
			addedCount,
			i,
			iMax,
			value,
            inserts,
			result;

		if (arguments.length >= 3) {
			inserts = args[3];
			if (!type.isArray(inserts)) {
				inserts = [inserts];
			}
			for (i = 0, iMax = inserts.length; i < iMax; i += 1) {
				value = inserts[i];
				if (!type.isInstanceOf(Ctor, value)) {
					if (this.context) {
						value = this.context.create(Ctor, value);
					} else if (Ctor){
						value = new Ctor(value);
					}
				}
				inserts[i] = value;
			}
			// Note: we don't splice here one-by-one within the for-loop
			// because each splice() would trigger change notification.
			// The tradeoff is having to iterate over all inserts twice -
			// here and in ArraySet.splice().
			return ArraySet.prototype.splice.apply(this, args.concat(inserts));
		} else {
			return ArraySet.prototype.splice.apply(this, arguments);
		}
	}
	/**
	 * Pushes an element to the set.
	 */
	unshift() {
		this.push.apply(this, arguments);
		return this.length;
	}

    /**
	 * Creates a new entity set with entities of the given `EntityTypeCtor`.
	 *
	 * @method collection/EntitySet.create
	 * @param {function} EntityTypeCtor
	 * @param {IContext} context
	 * @param {Array<object|string|number>} data
	 */
	static create(EntityTypeCtor, context?, data?) {
		var s = new EntitySet(EntityTypeCtor, { context: context });
		if (data) {
			s.push.apply(s, data);
		}
		return s;
	}
}
