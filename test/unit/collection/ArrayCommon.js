/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 * @module test/unit/ArraySet
 */
define([
	"intern!object",
	"intern/chai!assert",
	"pure/collection/Array",
	"pure/collection/ArraySet",
	"pure/collection/SortedArraySet",
	"pure/collection/EntitySet"
], function(registerSuite, assert, ArrayBase, ArraySet, SortedArraySet, EntitySet) {

	var getArrayTests = function(name, ArrayImpl) {
		return {
			name: name,
			// before each test executes
			beforeEach: function() {
				// Do something...
			},

			length: function() {
				var s = new ArrayImpl();
				s.push(1);
				assert.equal(s.length, 1, '"length" (1/3) does not return the right value.');
				s.push(2);
				s.push(3);
				assert.equal(s.length, 3, '"length" (2/3) does not return the right value.');
				/*s.splice(0, 1);
				assert.equal(s.length, 2, '"length" (3/3) does not return the right value.');*/
			},

			push: function() {
				var s = new ArrayImpl();
				s.push(1,2,3);
				assert.equal(s.length, 3);
				s.push({
					id: "Hello",
					value: "World"
				});
				assert.equal(s.length, 4);
			},

			pop: function() {
				var s = new ArrayImpl();
				s.push(1,2,3);
				assert.equal(s.pop(), 3);
				assert.equal(s.pop(), 2);
				assert.equal(s.pop(), 1);
				assert.equal(s.pop(), undefined);
			},

			pop_from_empty: function() {
				var s = new ArrayImpl();
				assert.equal(s.pop(), undefined);
			},

			toJSON: function() {
				var s = new ArrayImpl(),
					str = "";

				s.push("a","b","c");
				str = JSON.stringify(s);
				assert.equal(str, '["a","b","c"]');
			},

			shift: function() {
				var s = new ArrayImpl(),
					shifted;
				s.push("a","b","c","d","e");
				shifted = s.shift();
				assert.equal(shifted, "a");
				assert.equal(s.length, 4);
			},

			unshift: function() {
				var s = new ArrayImpl(),
					shifted;
				s.unshift(1);
				s.unshift(2);
				s.unshift(3);
				assert.equal(s.length, 3, "Unexpected length.");
			},

			slice: function () {
				var s = new ArrayImpl(),
					i, len,
					slice0,
					slice1;
				s.push(0,1,2,3,4,5,6,7,8);
				slice0 = s.slice(4); // [5,6,7,8]
				slice1 = s.slice(1,4); // [1,2,3]
				for (i = 0, len = slice0.length; i < len; i += 1) {
					assert.equal(i+4, slice0[i], "slice(4)");
				}
				for (i = 0, len = slice1.length; i < len; i += 1) {
					assert.equal(i+1, slice1[i], "slice(1,4)");
				}
			},

			'splice(fromIdx)': function() {
				var set = new ArrayImpl(),
					set_expected,
					splice,
					splice_expected,
					i, len;

				// test splice(x)
				set.push(0,1,2,3,4,5,6,7,8,9);
				set_expected = [0,1,2,3];
				splice = set.splice(4);
				splice_expected = [4,5,6,7,8,9];
				// assert
				assert.equal(4, set.length, "Unexpected length of set after splice.");
				assert.equal(6, splice.length, "Unexpected length of splice");
				for (i = 0; i < set_expected.length; i+=1) {
					assert.equal(set[i], set_expected[i], "Unexpected value of set after splice.");
				}
				for (i = 0; i < splice_expected.length; i+=1) {
					assert.equal(splice[i], splice_expected[i], "Unexpected value of splice after splice.");
				}
			},
			'splice(fromIdx, len)': function() {
				var set = new ArrayImpl(),
					set_expected,
					splice,
					splice_expected,
					i, len;
				// test splice(x,y)
				set.push(0,1,2,3,4,5,6,7,8,9);
				splice = set.splice(1,4);
				set_expected = [0,5,6,7,8,9];
				splice_expected = [1,2,3,4];
				assert.equal(6, set.length, "Unexpected length of set after splice.");
				assert.equal(4, splice.length, "Unexpected length of splice");
				for (i = 0; i < set_expected.length; i+=1) {
					assert.equal(set[i], set_expected[i], "Unexpected value of set after splice.");
				}
				for (i = 0; i < splice_expected.length; i+=1) {
					assert.equal(splice[i], splice_expected[i], "Unexpected value of splice after splice.");
				}
			},

			splice_on_empty: function() {
				var s = new ArrayImpl(),
					result = s.splice();
				assert.strictEqual(result.length, 0);
			},

			indexOf: function() {
				var s = new ArrayImpl();

				s.push(1, 2);
				assert.strictEqual(s.indexOf(1), 0);
				assert.strictEqual(s.indexOf(2), 1);
				assert.strictEqual(s.indexOf(3), -1);
			}
		};
	};

	registerSuite(getArrayTests("collection/Array (common)", ArrayBase));
	registerSuite(getArrayTests("collection/ArraySet (common)", ArraySet));
	registerSuite(getArrayTests("collection/SortedArraySet (common)", SortedArraySet));
	registerSuite(getArrayTests("collection/EntitySet (common)", EntitySet));
});
