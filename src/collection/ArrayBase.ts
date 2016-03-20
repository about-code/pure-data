/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 *
 */
"use strict";
import {mixin} from "dojo/_base/lang";
import {type} from "pure/util/type";

var indexOf = function(arr, searchElement) {
    var i = 0,
        iMax = arr.length;
    for (i = 0; i < iMax; i += 1) {
        if (arr[i] === searchElement) {
            return i;
        }
    }
    return -1;
};

/**
 * Implementation of an observable Array. Note that Array.isArray()
 * will return false, for instances of collection/ArrayBase
 */
export class ArrayBase {
	isCollection = true;
    private _observerCallbacks = null;
    public length:number;
    public slice:Function;

	constructor() {
		this._observerCallbacks = [];
		Array.prototype.shift.call(this); // get native length property on 'this'
	}

	_notifyObservers(changes) {
		var i, iMax = this._observerCallbacks.length;
		for (i = 0; i < iMax; i += 1) {
			this._observerCallbacks[i].call(undefined, changes);
		}
	}

	/**
	 * Observe array with synchronous delivery of change records.
	 */
	observeSync(callback) {
		if (indexOf(this._observerCallbacks, callback) < 0) {
			this._observerCallbacks.push(callback);
		}
	}

	/**
	 * Remove an array observer.
	 */
	unobserveSync(callback) {
		var index = indexOf(this._observerCallbacks, callback);
		if (index >= 0) {
			this._observerCallbacks.splice(index, 1);
		}
	}

	/**
	 * Returns an iterator to iterate over the array values.
	 */
	values() {
		var that = this,
			len = this.length,
			i = -1;
		return {
			next: function() {
				i += 1;
				return i < len ? that[i] : undefined;
			}
		};
	}

	/**
	 * @method collection/ArrayBase.push
	 */
	push() {
		var index = this.length,
            changes = [],
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
	}
	/**
	 * @method collection/ArrayBase.pop
	 */
	pop() {
		var index = this.length - 1,
            changes = [],
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
	}
	/**
	 * @method collection/ArrayBase.shift
	 */
	shift() {
		var index = 0,
            changes = [],
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
	}
	/**
	 * @method collection/ArrayBase.unshift
	 */
	unshift(arg) {
		var index = 0,
			removed = [],
            changes = [],
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
	}
	/**
	 * @method collection/ArrayBase.splice
	 */
	splice(idx, count, e) {
		var index = idx || 0,
			removed = [],
            changes = [],
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
	}
	/**
	 * @method collection/ArrayBase.sort
	 */
	sort(comparator) {
		var clone = this.concat(),
			// non-conformant (not yet specified)
			changes = [{
				type: "sort",
				object: this
			}];
		Array.prototype.sort.call(this, comparator);
		this._notifyObservers(changes);
	}
	/**
	 * @method collection/ArrayBase.reverse
	 */
	reverse() {
		var clone = this.concat(),
			// non-conformant (not yet specified)
			changes = [{
				type: "sort",
				object: this
			}];
		Array.prototype.reverse.call(this);
		this._notifyObservers(changes);
	}
	/**
	 * @method collection/ArrayBase.concat
	 */
	concat() {
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
	}
	/**
	 * @method collection/ArrayBase.toJSON
	 */
	toJSON() {
		return this.slice();
	}
	/**
	 * @method collection/ArrayBase.forEach
	 */
	forEach(fn) {
		return Array.prototype.forEach.call(this, fn);
	}

    static create(data) {
    	var a = new ArrayBase();
    	a.push.apply(a, data);
    	return a;
    }
}

var arrayMethods = ["indexOf", "slice"],
	/** @method collection/ArrayBase.slice */
	/** @method collection/ArrayBase.indexOf */
	arrayMethod = function(methodName) {
		return function() {
			return Array.prototype[methodName].apply(this, arguments);
		};
	},
	i,
	iLen;

for (i = 0, iLen = arrayMethods.length; i < iLen; i += 1) {
	ArrayBase.prototype[arrayMethods[i]] = arrayMethod(arrayMethods[i]);
}

function observeSync(arr, callback) {
    var p, observableMixin;
    if (!type.isArray(arr)) {
        throw new TypeError("\"this\" is not an array");
    }
    if (arr.observeSync) {
        return arr.observeSync(callback);
    } else {
        // arr is not yet an observable array
		var arrData = arr.slice(); // Clone arr-data because...
        mixin(arr, new ArrayBase()); // ... arr loses its data for a moment...
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
