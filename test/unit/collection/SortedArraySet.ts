/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 */
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {SortedArraySet as ArrayImpl} from "pure/collection/collection";

registerSuite({
	name: "collection/SortedArraySet (type-specific)",
	// before each test executes
	beforeEach: function() {
		// Do something...
	},

	'splice(fromIdx, len, replace)': function() {
		var set = new ArrayImpl(),
			set_expected,
			splice,
			splice_expected,
			i, len;
		// test splice(x,y,z)
		set.push(0,1,2,3,4,5,6,7,8,9);
		set_expected = [0,1,2,3,-4,5,6,7,8,9];
		try {
			splice = set.splice(4,1,-4);
			assert.isFalse(true, "Error should have been raised. Should have run into catch() block.");
		} catch (err) {
		}
	},

	'shift(unshift())': function() {
		var s = new ArrayImpl(),
			shifted;
		s.unshift(1);
		s.unshift(2);
		s.unshift(3);
		assert.equal(s.shift(), 1);
		assert.equal(s.shift(), 2);
		assert.equal(s.shift(), 3);
	},

	push__check_keytable: function() {
		var i = 1,
			len = 5,
			result = -1,
			key = 0,
			keyCount = 0,
			it = null,
			s = new ArrayImpl();

		for (i = 1; i < len; i += 1) {
			result = s.push(i);
			assert.strictEqual(i, result, "Expected length " + i + " after push");
			assert.strictEqual(s.length, result, "Result of push() expected to be Set-length after insert.");
		}
		assert.strictEqual(4, s.length, "Set length does not match up with inserted records.");

		// Make sure keytable is valid.
		it = s.keys();
		for (i = 1; i < len; i += 1) {
			key = it.next();
			assert.strictEqual(i, key, "Corrupt keyset in Set.");
		}
	},

	push__same_twice: function() {
		var i = 0,
			len = 5,
			result = -1,
			s;

		s = new ArrayImpl();
		s.push(1);
		result = s.push(1);
		assert.strictEqual(1, result, "Expected still length 1 after pushing same number twice.");

		s = new ArrayImpl();
		s.push("a");
		result = s.push("a");
		assert.strictEqual(1, result, "Expected still length 1 after pushing same string twice.");

		s = new ArrayImpl();
		s.push({id: 1});
		result = s.push({id: 1});
		assert.strictEqual(1, result, "Expected still length 1 after pushing same object identity twice.");
	},

	push_incompatible_values: function() {
		console.warn("Not yet implemented.");
	},

	/**
	 * Pushing an unordered list of values should sort them upon insert.
	 */
	push_unordered_values: function() {
		var i,
			len = 5,
			s_num = new ArrayImpl(), exp_num = [1,2,3,4,5],
			s_str = new ArrayImpl(), exp_str = ["a","b","c","d","e"],
			s_obj = new ArrayImpl(), exp_obj = [{id: '1'},{id:'2'},{id:'3'},{id:'4'},{id:'5'}];

		s_num.push(1, 4, 5, 3, 2);
		s_str.push("a", "d", "e", "c", "b");
		s_obj.push(exp_obj[0], exp_obj[3], exp_obj[4], exp_obj[2], exp_obj[1]);

		for(i = 0; i < len; i += 1) {
			assert.strictEqual(exp_num[i], s_num[i], "Did not insert number " + s_num[i] + " at correct position.");
			assert.strictEqual(exp_str[i], s_str[i], "Did not insert string " + s_str[i] + " at correct position.");
			assert.strictEqual(exp_obj[i], s_obj[i], "Did not insert object " + s_obj[i] + " at correct position.");
		}
	},

	push_unordered_mixed_values: function() {
		console.warn("Not yet implemented.");
	},

	keys: function() {
		console.warn("Not yet implemented.");
	}
});
