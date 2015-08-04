/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */
define([
	"intern!object",
	"intern/chai!assert",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"pure/util/type",
	"pure/data/Model",
	"pure/data/Property",
	"pure/data/EntityManager"
], function(registerSuite, assert, declare, lang, type, Model, Property, EntityManager) {

	registerSuite({
		name: "data/Property",
		// before each test executes
		beforeEach: function () {
		},

		instantiation__noargs: function() {
			var p1, p2;

			// Test default initialization
			p1 = new Property();
			assert.strictEqual(p1.get("default"), undefined);
			assert.strictEqual(p1.get("name"), null);
			assert.strictEqual(p1.get("type"), "any");
			assert.strictEqual(p1.get("dtype"), null);
			assert.strictEqual(p1.get("flags"), "");
			assert.strictEqual(p1.get("scenario"), "*");
			assert.strictEqual(p1.get("plain"), null);
			assert.strictEqual(p1.get("formatter"), null);
			assert.strictEqual(p1.get("parser"), null);
			assert.strictEqual(p1.get("validator"), null);
			assert.strictEqual(p1.get("inverse"), "");

			// Test second constructor param
			p2 = new Property(null, "p2");
			assert.strictEqual(p2.get("default"), undefined);
			assert.strictEqual(p2.get("name"), "p2", "Second constructor param not initialized.");
			assert.strictEqual(p2.get("type"), "any");
			assert.strictEqual(p2.get("dtype"), null);
			assert.strictEqual(p2.get("flags"), "");
			assert.strictEqual(p2.get("scenario"), "*");
			assert.strictEqual(p2.get("plain"), null);
			assert.strictEqual(p2.get("formatter"), null);
			assert.strictEqual(p2.get("parser"), null);
			assert.strictEqual(p2.get("validator"), null);
			assert.strictEqual(p2.get("inverse"), "");
		},

		instantiation__call_default_value_initializer: function() {
			var p;
			// Test evaluation of initializer-function
			p = new Property({
				default: function() {
					return "abc"; // type determination should yield "string"
				}
			});
			assert.strictEqual(p.get("default"), "abc");
		},

		instantiation__resolve_type_by_default_value: function() {

			var pUndef = new Property({ default: undefined });
			assert.strictEqual(pUndef.get("type"), "any");

			var pNull = new Property({ default: null });
			assert.strictEqual(pNull.get("type"), "any");

			var pNumber = new Property({ default: 1 });
			assert.strictEqual(pNumber.get("type"), "number");

			var pString = new Property({ default: "1" });
			assert.strictEqual(pString.get("type"), "string");

			var pArray = new Property({ default: [] });
			assert.strictEqual(pArray.get("type"), "array");

			var pObject = new Property({ default: {} });
			assert.strictEqual(pObject.get("type"), "object");

			var pDate = new Property({ default: new Date() });
			assert.strictEqual(pDate.get("type"), "date");

			// test that a given type has precedence over type determination
			var pManual = new Property({ default: new Date(), type: "manual"});
			assert.strictEqual(pManual.get("type"), "manual");
		},


		getOwnProperty__methods: function() {
			console.warn("Not yet implemented.");
		},

		/**
		 * Observing a property should include observing changes to an array
		 * if the property value is an array.
		 */

		subscribe__to_changes_stream: function() {
			var manager = new EntityManager(),
				T = declare([Model], {
					$schema: {
						prop: {default: []}
					}
				}),
				t = manager.create(T),
				array = null,
				subscriberCallCounter = 0,
				propertyChanges = null,
				changesSubscriber = function(change) {
					// we are only interested in changes to the property's
					// array value, which are communicated via type "splice"
					subscriberCallCounter += 1;
					if (change.type === "splice") {
						propertyChanges = change;
					}
				},
				subscribeHandle;


			subscribeHandle = t.property("prop").changes().subscribe(changesSubscriber);
			array = t.property("prop").valueOf();

			// subscriberCallCounter += 1
			array.push("push 1");

			assert.strictEqual(subscriberCallCounter, 1, "Observer expected to be called exactly twice.");
			assert.strictEqual(propertyChanges.type, "splice", "addedObserver (type)");
			assert.strictEqual(propertyChanges.addedCount, 1, "addedObserver (addedCount)");
			assert.strictEqual(propertyChanges.index, 0, "addedObserver (index)");
			assert.strictEqual(propertyChanges.object, t.prop, "addedObserver (object)");
			assert.isTrue(type.isArray(propertyChanges.removed), "addedObserver (removed)");

			// property observer should be removed from 'array's observers,
			// when 'array' is no longer the property's value
			// subscriberCallCounter += 1
			t.property("prop").put(null);

			// when pushing to 'array' now, number of observed changes should remain unchanged.
			// subscriberCallCounter += 0
			array.push("push 2");
			assert.strictEqual(subscriberCallCounter, 2,
				"Property observer called for changes to array, although array " +
				"is no longer observed property's value.");

			// when making 'array' the property's value again, it should be
			// observed for changes again.
			// subscriberCallCounter += 1
			t.property("prop").put(array);

			// subscriberCallCounter += 1
			array.push("push 3");
			assert.strictEqual(subscriberCallCounter, 4,
				"Property observer not called for changes to array, when array " +
				"made property value again.");

			subscribeHandle.dispose();
			// subscriberCallCounter += 0
			array.push("push 4");
			assert.strictEqual(subscriberCallCounter, 4,
				"Property observer still called after unobserve().");
		},
	});
});
