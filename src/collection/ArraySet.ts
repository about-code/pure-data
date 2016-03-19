/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @extends collection/Array
 * @param {object} opts Options:
 *
 * - **keyFn: function** A function `fn(value):any` which will be
 * assigned to `this.key`. It is expected to be able to derive a key
 * from a value. E.g. if `value` is an object the key returned by
 * `keyFn` may be the value of an ID property ("logical identity")
 * rather than the actual object reference ("physical identity").
 *
 */
"use strict";
import {ArrayBase} from "pure/collection/ArrayBase";

// TODO: Abandon ArraySet in favour of ES6 Map?
export class ArraySet extends ArrayBase /** @lends collection/ArraySet.prototype */{

	private _byKey = {};

	constructor(opts?) {
        super();
		this._byKey = {};
		opts = opts || {};
		if (opts.keyFn && typeof opts.keyFn === "function") {
			this.key = opts.keyFn;
		}
	}

	/**
	 * Used to determine the key of a given value prior to inserting the
	 * value. If a `keyFn` key provider was passed to the constructor,
	 * then `key` will be set to `keyFn`. The default implementation will
	 * use the value itself as the key.
	 * @param {any} value
	 * @return {any} key
	 */
	key(value:any) {
		return value;
	}

	/**
	 * @return Iterator Keys iterator
	 */
	keys() {
		var that = this,
			keys = Object.getOwnPropertyNames(this._byKey),
			len = keys.length,
			i = -1;
		return {
			next: function() {
				i += 1;
				return i < len ? keys[i] : undefined;
			}
		};
	}

	/**
	 * Return the value for a given key.
	 */
	value (key) {
		return this._byKey[key];
	}

	/**
	 * @return Iterator Values iterator
	 */
	values() {
		var that = this,
			keys = Object.getOwnPropertyNames(this._byKey),
			len = keys.length,
			i = -1;
		return {
			next: function() {
				i += 1;
				return i < len ? that._byKey[keys[i]] : undefined;
			}
		};
	}

	/**
	 * Adds new entries to the collection. Only those entries are added for which
	 * the `key` function does not return a key that is already present in the
	 * set.
	 */
	push(...values) {
		var arg, i, len, key, notInSet = [];
		for (i = 0, len = arguments.length; i < len; i += 1) {
			arg = arguments[i];
			key = this.key(arg);
			if (!this._byKey[key]) {
				this._byKey[key] = arg;
				notInSet.push(arg);
			}
		}
		if (notInSet.length > 0) {
			ArrayBase.prototype.push.apply(this, notInSet);
		}
		return this.length;
	}
	/**
	 * Inserts a new entry into the collection using {@link #push}.
	 */
	add(e) {
		this.push(e);
		return this;
	}
	/**
	 * Pops an entry from the end of the set.
	 */
	pop() {
		var elem = ArrayBase.prototype.pop.call(this);
		delete this._byKey[this.key(elem)];
		return elem;
	}
	/**
	 * Adds or removes certain entries from the set.
	 * @param {number} idx Finite number and valid index
	 * @param {number} count Finite number and valid count
	 * @param {any} e Element(s) to insert at `idx`
	 */
	splice(idx, count, e) {
		var sliced = [],
			i,
			len = arguments.length;

		if (len <= 1) {
			sliced = ArrayBase.prototype.splice.call(this, idx);
		} else if (len === 2) {
			sliced = ArrayBase.prototype.splice.call(this, idx, count);
		} else if (len >= 3) {
			sliced = ArrayBase.prototype.splice.call(this, idx, count, e);
		}
		for (i = 0, len = sliced.length; i < len; i += 1) {
			delete this._byKey[this.key(sliced[i])];
		}
		return sliced;
	}
	/**
	 * Shifts an element from the beginning of the set.
	 */
	shift() {
		var key,
			result = ArrayBase.prototype.shift.call(this); // should be this[key]
		if (result) {
			delete this._byKey[this.key(result)];
		}
		return result;
	}
	/**
	 * Pushes an element to the beginning of the set.
	 */
	unshift() {
		var arg, i, len, key;
		for (i = 0, len = arguments.length; i < len; i += 1) {
			arg = arguments[i];
			key = this.key(arg);
			if (!this._byKey[key]) {
				ArrayBase.prototype.unshift.call(this, arg);
				this._byKey[key] = arg;
			}
		}
		return this.length;
	}

    static create(data, ...args) {
    	var s = new ArraySet();
    	s.push.apply(s, data);
    	return s;
    }
}
