/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */
"use strict";
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {shared} from "pure/lang/typescript";
import {type} from "pure/util/util";
import {datatype, field} from "pure/data/decorators";
import {Model, Field, EntityManager} from "pure/data/data";

registerSuite({
	name: "data/Field",
	// before each test executes
	beforeEach: function () { return; },
	instantiation__noargs: function() {
		var p1, p2;

		// Test default initialization
		p1 = new Field();
		assert.strictEqual(p1.get("name"), null);
		assert.strictEqual(p1.get("type"), "any");
		assert.strictEqual(p1.get("dtype"), null);
		assert.strictEqual(p1.get("flags"), "");
		assert.strictEqual(p1.get("plain"), null);
		assert.strictEqual(p1.get("formatter"), null);
		assert.strictEqual(p1.get("parser"), null);
		assert.strictEqual(p1.get("validator"), null);
		assert.strictEqual(p1.get("inverse"), "");
		assert.isFalse(p1.get("ignore"));

		// Test second constructor param
		p2 = new Field(null, "p2");
		assert.strictEqual(p2.get("name"), "p2", "Second constructor param not initialized.");
		assert.strictEqual(p2.get("type"), "any");
		assert.strictEqual(p2.get("dtype"), null);
		assert.strictEqual(p2.get("flags"), "");
		assert.strictEqual(p2.get("plain"), null);
		assert.strictEqual(p2.get("formatter"), null);
		assert.strictEqual(p2.get("parser"), null);
		assert.strictEqual(p2.get("validator"), null);
		assert.strictEqual(p2.get("inverse"), "");
		assert.isFalse(p2.get("ignore"));
	},

	getOwnField__methods: function() {
		console.warn("Not yet implemented.");
	},


	setValue_return: function() {
        @datatype("T")
        class T extends Model {
            @field({default: "", setValue: function (newValue) { return "Hallo-Rewritten"; }})
            prop;
        }
		var manager = new EntityManager();
		var t = new T();
		t.prop = "Hallo";
		assert.strictEqual(t.prop, "Hallo");
        t.field("prop").put("Hallo");
        assert.strictEqual(t.prop, "Hallo-Rewritten");
	},

	setValue_rewrite: function() {
        @datatype("T")
        class T extends Model {
            @field({
                setValue: function (newValue) {
                    // setValue() is a side-effect of t.prop = "Hallo"!
                    // Note that the next statement means we try to
                    // write to t.prop _while_ the statement t.prop = "Hallo"
                    // is processed. In this scenario the rewrite value
                    // gets active "asynchronously."
                    this.prop = "Hallo-Rewritten";
                    assert.strictEqual(this.prop, "Hallo-Rewritten");
                }
            }) prop = "";
        }
		var manager = new EntityManager();
		var t = new T();
        t.prop = "Hallo";
		assert.strictEqual(t.prop, "Hallo");
	},

	/**
	 * Observing a field should include observing changes to an array
	 * if the field value is an array.
	 */
	subscribe__to_changes_stream: function() {
        @datatype(T)
        class T extends Model {
            @field() prop = [];
        }
        var manager = new EntityManager();
		var t = manager.create(T);
		var array = null;
		var subscriberCallCounter = 0;
		var fieldChanges = null;
		var changesSubscriber = function(change) {
			// we are only interested in changes to the field's
			// array value, which are communicated via type "splice"
			subscriberCallCounter += 1;
			if (change.type === "splice") {
				fieldChanges = change;
			}
		};
		var subscribeHandle;

		subscribeHandle = t.field("prop").changes().subscribe(changesSubscriber);
		array = t.field("prop").valueOf();

		// subscriberCallCounter += 1
		array.push("push 1");

		assert.strictEqual(subscriberCallCounter, 1, "Observer expected to be called exactly twice.");
		assert.strictEqual(fieldChanges.type, "splice", "addedObserver (type)");
		assert.strictEqual(fieldChanges.addedCount, 1, "addedObserver (addedCount)");
		assert.strictEqual(fieldChanges.index, 0, "addedObserver (index)");
		assert.strictEqual(fieldChanges.object, t.prop, "addedObserver (object)");
		assert.isTrue(type.isArray(fieldChanges.removed), "addedObserver (removed)");

		// field observer should be removed from 'array's observers,
		// when 'array' is no longer the field's value
		// subscriberCallCounter += 1
		t.field("prop").put(null);

		// when pushing to 'array' now, number of observed changes should remain unchanged.
		// subscriberCallCounter += 0
		array.push("push 2");
		assert.strictEqual(subscriberCallCounter, 2,
			"Field observer called for changes to array, although array " +
			"is no longer the observed field's value.");

		// when making 'array' the field's value again, it should be
		// observed for changes again.
		// subscriberCallCounter += 1
		t.field("prop").put(array);

		// subscriberCallCounter += 1
		array.push("push 3");
		assert.strictEqual(subscriberCallCounter, 4,
			"Field observer not called for changes to array, when array " +
			"made field value again.");

		subscribeHandle.dispose();
		// subscriberCallCounter += 0
		array.push("push 4");
		assert.strictEqual(subscriberCallCounter, 4,
			"Field observer still called after unobserve().");
	},

    computed_field_basic_ops: function () {
        @datatype(T)
        class T extends Model {
            @field() firstName: string;
            @field() lastName: string;
            @field({
                dependsOn: ["firstName", "lastName"],
                setValue: function(fullName) {
                    fullName = fullName.split(" ");
                    this.firstName = fullName[0];
                    this.lastName = fullName[1];
                },
                getValue: function () {
                    return this.firstName + " " + this.lastName;
                }
            }) fullName: string;
        }
        var manager = new EntityManager();
		var t = manager.create(T);

        t.firstName = "Foo";
        t.lastName = "Bar";
        assert.strictEqual(t.fullName, "Foo Bar");
        t.lastName = "Fighters";
        assert.strictEqual(t.fullName, "Foo Fighters");
    }
});
