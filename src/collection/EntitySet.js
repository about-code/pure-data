/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 *
 * @constructor collection/EntitySet
 * @extends collection/ArraySet
 * @param {object} opts Options:
 *
 * - **EntityType: function** Entity type constructor function
 * - **entityManager: [EntityManager](./EntityManager.html)** The entity manager to use for creating new entities when adding a plain object or entity identifier to the set.
 * - ...further options see [ArraySet](./ArraySet.html),
 */
define([
	"dojo/_base/declare",
	"./ArraySet",
	"../util/dtype",
	"../data/Entity"
], function(declare, Base, type, Entity) {
	"use strict";

	var Ctor = declare([Base], /** @lends collection/EntitySet.prototype */ {

		constructor: function (opts) {
			opts = opts || {};
			this.EntityType = opts.EntityType;
			this.em = opts.entityManager;
		},
		key: Entity.getId,

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
		 * @see {@link data/Entity|Entity}
		 * @see {@link collection/ArraySet|ArraySet}
		 */
		push: function() {
			var i,
				iLen,
				value,
				Ctor = this.EntityType,
				values = [];
			for (i = 0, iLen = arguments.length; i < iLen; i += 1) {
				value = arguments[i];
				if (!type.isInstanceOf(Ctor, value)) {
					if (this.em) {
						value = this.em.create(Ctor, value);
					} else if (Ctor) {
						value = new Ctor(value);
					}
				}
				values.push(value);
			}
			// Note: we don't run Base.push one-by-one within the for-loop
			// because each push() would trigger change notification.
			// The tradeoff is having to iterate over all new elements twice -
			// here and in Base.push().
			Base.prototype.push.apply(this, values);
			return this.length;
		},
		/**
		 * Adds or removes entries from the entity set. See {@link #push}
		 * for how the method behaves when new entries are added.
		 */
		splice: function() {
			var index = arguments[0],
				args = [arguments[0], arguments[1]],
				oldLength = this.length,
				Ctor = this.EntityType,
				addedCount,
				i,
				iMax,
				value,
				result;

			if (arguments.length >= 3) {
				inserts = args[3];
				if (!type.isArray(inserts)) {
					inserts = [inserts];
				}
				for (i = 0, iMax = inserts.length; i < iMax; i += 1) {
					value = inserts[i];
					if (!type.isInstanceOf(Ctor, value)) {
						if (this.em) {
							value = this.em.create(Ctor, value);
						} else if (Ctor){
							value = new Ctor(value);
						}
					}
					inserts[i] = value;
				}
				// Note: we don't splice here one-by-one within the for-loop
				// because each splice() would trigger change notification.
				// The tradeoff is having to iterate over all inserts twice -
				// here and in Base.splice().
				return Base.prototype.splice.apply(this, args.concat(inserts));
			} else {
				return Base.prototype.splice.apply(this, arguments);
			}
		},
		/**
		 * Pushes an element to the set.
		 */
		unshift: function() {
			this.push.apply(this, arguments);
			return this.length;
		}
	});

	/**
	 * Creates a new entity set with entities of the given `EntityType`.
	 * Note that the preferred way to create an entity set should be
	 * using a particular entity manager's `createCollection` method.
	 * @method collection/EntitySet.create
	 * @param {function} EntityTypeCtor
	 * @param {Array<object|string|number>} data
	 * @param {data/EntityManager} entityManager
	 * @see {@link data/EntityManager#createCollection}
	 */
	Ctor.create = function (EntityTypeCtor, data, entityManager) {
		var s = new Ctor({
			EntityType: EntityTypeCtor,
			entityManager: entityManager
		});
		if (data) {
			s.push.apply(s, data);
		}
		return s;
	};
	return Ctor;
});
