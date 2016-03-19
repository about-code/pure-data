/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 * @module my/module
 */
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {ArrayBase as ArrayImpl} from "pure/collection/collection";

registerSuite({
	name: "collection/Array (type-specific)",
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
		splice = set.splice(4,1,-4); // [1,2,3,4]; set1 => [0,5,6,7,8,9];
		splice_expected = [4];
		assert.equal(10, set.length, "Unexpected length of set after splice.");
		assert.equal(1, splice.length, "Unexpected length of splice");
		for (i = 0; i < set_expected.length; i+=1) {
			assert.equal(set[i], set_expected[i], "Unexpected value of set after splice.");
		}
		for (i = 0; i < splice_expected.length; i+=1) {
			assert.equal(splice[i], splice_expected[i], "Unexpected value of splice after splice.");
		}
	},

	'shift(unshift())': function() {
		var s = new ArrayImpl(),
			shifted;
		s.unshift(1);
		s.unshift(2);
		s.unshift(3);
		assert.equal(s.shift(), 3);
		assert.equal(s.shift(), 2);
		assert.equal(s.shift(), 1);
	},
});
