/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 *
 * @extends collection/ArrayBase
 */
"use strict";
import {ArrayBase} from "pure/collection/ArrayBase";

var INSERT_AT = 0,
INDEX_OF = 1,
/**
 * Binary search on keyset (index)
 */
binarySearch = function(key, keyset, mode) {
	var arr = keyset,
		arr_len = arr.length,
		from = 0,
		to = 0,
		middle = 0,
		key_insert,
		key_left,
		key_right;

	from = 0;
	to = arr_len - (arr_len === 0 ? 0 : 1);
	if (arr_len === 0) {
		return mode === INSERT_AT ? 0 : -1;
	} else if (arr[0] > key && mode === INSERT_AT) {
		return 0;      // insert at begin
	} else if (arr[to] < key && mode === INSERT_AT) {
		return to + 1; // push to end
	} else if (arr[to] === key) {
		return mode === INSERT_AT ? -1 : to;
	} else {
		do {		   // search pos
			middle = (from + to) >> 1; // devide range by 2
			key_insert = key;
			key_left  = arr[middle];
			key_right = arr[middle+1];
			if (key_left <= key_insert && key_right >= key_insert) {
				if (key_left === key_insert) {
					// if INSERT_AT, refuse because key already exist
					return mode === INSERT_AT ? -1 : middle;
				} else if (key_right === key_insert) {
					// if INSERT_AT, refuse because key already exist
					return mode === INSERT_AT ? -1 : middle + 1;
				} else {
					// if INSERT_AT return insert-idx. If INDEX_OF, return not found
					return mode === INSERT_AT ? middle + 1 : -1;
				}
			} else if (key_left < key_insert) {
				from = middle + 1;
			} else { // (key_right > key_insert) {
				to = middle - 1;
			}
		} while (from <= to);
	}
	return mode === INSERT_AT ? arr_len : -1;
};

/**
 * Implementation of a sorted Set. Note that Array.isArray()
 * will return false, for instances of this class.
 */
export class SortedArraySet extends ArrayBase /** @lends collection/SortedArraySet.prototype */ {

    private _keyset = null;

	constructor(opts) {
        super();
		this._keyset = [];
	}

	/**
	 * May be overwritten if different sort strategy is needed.
	 */
	key (value) {
		if (Object.prototype.toString.call(value) === "[object Object]") {
			return value.id;
		} else if (Object.prototype.toString.call(value) === "[object Date]") {
			return value.getTime();
		} else {
			return value;
		}
	}

	push(...values) {
		var args = Array.prototype.slice.call(arguments),
			entry, value, i, len, insertAt;
		for (i = 0, len = args.length; i < len; i += 1) {
			value = args[i];
			entry = {
				key: this.key(value),
				value: value
			};
			if (entry !== null) {
				insertAt = binarySearch(entry.key, this._keyset, INSERT_AT);
				if (insertAt >= 0) {
					Array.prototype.splice.call(this._keyset, insertAt, 0, entry.key);
					ArrayBase.prototype.splice.call(this, insertAt, 0, entry.value);
				}
			}
		}
		return this.length;
	}
	add(value) {
		this.push(value);
		return this;
	}
	keys() {
		var that = this,
			len = that._keyset.length,
			i = -1;
		return {
			next: function() {
				i += 1;
				return i < len ? that._keyset[i] : undefined;
			}
		};
	}
	values() {
		var that = this,
			len = that.length,
			i = -1;
		return {
			next: function() {
				i += 1;
				return i < len ? that[i] : undefined;
			}
		};
	}
	pop() {
		Array.prototype.pop.call(this._keyset);
		return ArrayBase.prototype.pop.call(this);
	}
	indexOf(value) {
		if (value === undefined) {
			return -1;
		}
		var entry = {
			key: this.key(value),
			value: value
		};
		return binarySearch(entry.key, this._keyset, INDEX_OF);
	}
	splice(idx, count, e) {
		var sliced = [],
			i,
			len = arguments.length;

		if (len <= 1) {
			sliced = ArrayBase.prototype.splice.call(this, idx);
			Array.prototype.splice.call(this._keyset, idx);
		} else if (len === 2) {
			sliced = ArrayBase.prototype.splice.call(this, idx, count);
			Array.prototype.splice.call(this._keyset, idx, count);
		} else if (len >= 3) {
			throw new Error("SortedArraySet does not support \"splice(idxFrom, len, replace)\" and inserting elements at a specified position.");
		}
		return sliced;
	}
	unshift() {
		return this.push.apply(this, arguments);
	}
	sort() {
		/* Array can't be sorted manually */
		if (console && console.warn) {
			console.warn("SortedArraySet does not support \"sort(sortFn)\". Elements are already sorted based on their key.");
		}
		return this;
	}
	toJSON() {
		var i, len = this.length,
			out = new Array(len);
		for (i = 0; i < len; i += 1) {
			out[i] = this[i];
		}
		return out;
	}
};
