/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 * @module test/unit/ArraySet
 */
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {ArraySet as ArrayImpl} from "pure/collection/collection";

registerSuite({
	name: "collection/ArraySet (type-specific)",
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

	'indexOf(object)': function() {
		var keyProvider = function(value) {
			if (typeof value === 'object' && value.hasOwnProperty('id')) {
				return value.id;
			} else {
				return value;
			}
		};
		var s = new ArrayImpl({keyFn: keyProvider});
		var obj1 = {
			id: 1,
			prop: 'value'
		};
		var obj2 = {
			id: 2,
			prop: 'value'
		};
		var obj3 = null;

		s.push(obj1, obj2);
		assert.strictEqual(s.indexOf(obj1),  0);
		assert.strictEqual(s.indexOf(obj2),  1);
		assert.strictEqual(s.indexOf(obj3), -1);
	},

	push__same_twice: function() {
		var keyProvider = function(value) {
				if (typeof value === 'object' && value.hasOwnProperty('id')) {
					return value.id;
				} else {
					return value;
				}
			},
			s = new ArrayImpl({keyFn: keyProvider});

		s.push({
			id: '1',
			prop: 1
		}, {
			id: '1',
			prop: 2
		}, {
			id: '2',
			prop: 2
		});
		assert.equal(s.length, 2, "Unexpected length.");
		assert.equal(s[0].prop, 1);
		assert.equal(s[1].prop, 2);
	}
});
