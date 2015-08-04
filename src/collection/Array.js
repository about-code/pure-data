/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @constructor collection/Array
 */
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"../util/type"
], function(declare, lang, type) {

	var indexOf = function(arr, searchElement) {
	        var i = 0; iMax = arr.length;
	        for (i = 0; i < iMax; i += 1) {
	            if (arr[i] === searchElement) {
	                return i;
	            }
	        }
	        return -1;
	    },

		/**
		 * Implementation of an observable Array. Note that Array.isArray()
		 * will return false, for instances of collection/Array
		 */
		Arr = declare([], /** @lends collection/Array.prototype */{
			isCollection: true,

			constructor: function() {
				this._observerCallbacks = [];
				Array.prototype.shift.call(this); // get native length property on 'this'
			},

			_notifyObservers: function(changes) {
				var i, iMax = this._observerCallbacks.length;
				for (i = 0; i < iMax; i += 1) {
					this._observerCallbacks[i].call(undefined, changes);
				}
			},

			/**
			 * Observe array with synchronous delivery of change records.
			 */
			observeSync: function(callback) {
				if (indexOf(this._observerCallbacks, callback) < 0) {
					this._observerCallbacks.push(callback);
					return;
				} else {
					return;
				}
				this._observerCallbacks.push(callback);
			},

			/**
			 * Remove an array observer.
			 */
			unobserveSync: function(callback) {
				var index = indexOf(this._observerCallbacks, callback);
				if (index >= 0) {
					this._observerCallbacks.splice(index, 1);
				}
			},

			/**
			 * Returns an iterator to iterate over the array values.
			 */
			values: function() {
				var that = this,
					len = this.length,
					i = -1;
				return {
					next: function() {
						i += 1;
						return i < len ? that[i] : undefined;
					}
				};
			},

			/**
			 * @method collection/Array#push
			 */
			push: function() {
				var index = this.length,
					changeRecord,
					result;

				result = Array.prototype.push.apply(this, arguments);
				changes = [{
					type: "splice",
					object: this,
					index: index,
					addedCount: arguments.length,
					removed: []
				}];
				this._notifyObservers(changes);
				return result;
			},
			/**
			 * @method collection/Array#pop
			 */
			pop: function() {
				var index = this.length - 1,
					removed = [],
					changeRecord;

				removed.push(Array.prototype.pop.call(this));
				changes = [{
					type: "splice",
					object: this,
					index: index,
					addedCount: 0,
					removed: removed
				}];
				this._notifyObservers(changes);
				return removed[0];
			},
			/**
			 * @method collection/Array#shift
			 */
			shift: function() {
				var index = 0,
					removed = [],
					changeRecord;

				removed.push(Array.prototype.shift.call(this));
				changes = [{
					type: "splice",
					object: this,
					index: index,
					addedCount: 0,
					removed: removed
				}];
				this._notifyObservers(changes);
				return removed[0];
			},
			/**
			 * @method collection/Array#unshift
			 */
			unshift: function(arg) {
				var index = 0,
					removed = [],
					changeRecord,
					result;

				result = Array.prototype.unshift.call(this, arg);
				changes = [{
					type: "splice",
					object: this,
					index: index,
					addedCount: 1,
					removed: removed
				}];
				this._notifyObservers(changes);
				return result;
			},
			/**
			 * @method collection/Array#splice
			 */
			splice: function() {
				var index = arguments[0] || 0,
					removed = [],
					oldLength = this.length,
					addedCount = 0,
					changeRecord;

				removed = Array.prototype.splice.apply(this, arguments);
				addedCount = this.length - oldLength;
				addedCount = addedCount >= 0 ? addedCount : 0;
				changes = [{
					type: "splice",
					object: this,
					index: index,
					addedCount: addedCount,
					removed: removed
				}];
				this._notifyObservers(changes);
				return removed;
			},
			/**
			 * @method collection/Array#sort
			 */
			sort: function(comparator) {
				var clone = this.concat(),
					// non-conformant (not yet specified)
					changes = [{
						type: "sort",
						object: this
					}];
				Array.prototype.sort.call(this, comparator);
				this._notifyObservers(changes);
			},
			/**
			 * @method collection/Array#reverse
			 */
			reverse: function() {
				var clone = this.concat(),
					// non-conformant (not yet specified)
					changes = [{
						type: "sort",
						object: this
					}];
				Array.prototype.reverse.call(this);
				this._notifyObservers(changes);
			},
			/**
			 * @method collection/Array#concat
			 */
			concat: function() {
				var i = 0,
					len = 0,
					arg,
					result = this.slice();
				for (i = 0, len = arguments.length; i < len; i += 1) {
					arg = arguments[i];
					if (typeof arg.slice === "function") {
						result = result.concat(arg.slice());
					} else {
						result[result.length] = arg;
					}
				}
				return result;
			},
			/**
			 * @method collection/Array#toJSON
			 */
			toJSON: function() {
				return this.slice();
			},
			/**
			 * @method collection/Array#forEach
			 */
			forEach: function(fn) {
				return Array.prototype.forEach.call(this, fn);
			},
		}),
		arrayMethods = ['indexOf', 'slice'],
		/** @method collection/Array#slice */
		/** @method collection/Array#indexOf */
		arrayMethod = function(methodName) {
			return function() {
				return Array.prototype[methodName].apply(this, arguments);
			};
		},
		i,
		iLen;

	for (i = 0, iLen = arrayMethods.length; i < iLen; i += 1) {
		Arr.prototype[arrayMethods[i]] = arrayMethod(arrayMethods[i]);
	}

	function observeSync(arr, callback) {
        var p, observableMixin;
        if (!type.isArray(arr)) {
            throw new TypeError('"this" is not an array');
        }
        if (arr.observeSync) {
            return arr.observeSync(callback);
        } else {
            // arr is not yet an observable array
			var arrData = arr.slice(); // Clone arr-data because...
            lang.mixin(arr, new Arr()); // ... arr loses its data for a moment...
			arr.push.apply(arr, arrData); // ... and gets it pushed here again.
			arr.observeSync(callback);
        }
    }

    function unobserveSync(arr, callback) {
        if (arr.unobserveSync) {
            return arr.unobserveSync(callback);
        }
    }

	//  Non-standard synchronous observation
    Array.observeSync = observeSync;
    Array.unobserveSync = unobserveSync;

	Arr.create = function (data) {
		var a = new Arr();
		a.push.apply(a, data);
		return a;
	};

	return Arr;
});
