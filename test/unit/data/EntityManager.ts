/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 * @module test/unit/data/EntityManager
 */
"use strict";
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {datatype, field} from "pure/data/decorators";
import {Entity, EntityManager, Model} from "pure/data/data";
import "../mocks/mocks";

function test_integrate_dstore() {

    @datatype("MyEntityType")
	class MyEntityType extends Model {
        @field() id = -1;
		@field() value = "default";
    }
	var	plainEntity1 = {
			id: 1,
			value: "entity1"
		},
		manager = new EntityManager(),
		dfd;

	dfd = this.async(3000);
	manager.getService(MyEntityType)
		.put(plainEntity1)
		.then(function(putResult) {
			assert.isDefined (manager.lookup(MyEntityType, 1), "Entity was not registered with the manager when being put into the store.");
			assert.strictEqual(manager.lookup(MyEntityType, 1), putResult, "Entity in manager and entity put to store are not the same.");
			assert.strictEqual(manager.create(MyEntityType, {id: 1}), putResult, "Multiple instances of the same entity created.");
			return manager.getStore(MyEntityType).get(1);
		})
		.then(function(getResult) {
			assert.strictEqual(manager.lookup(MyEntityType, 1), getResult, "Entity in manager and entity got from store are not the same.");
			assert.strictEqual(manager.create(MyEntityType, {id: 1}), getResult, "Multiple instances of the same entity created.");
			assert.equal(manager.lookup(MyEntityType, 1).get("value"), "entity1");
			manager.destroy();
			return manager.getStore(MyEntityType).remove(1);
		})
		.then(function(removeResult) {
			var entity = manager.lookup(MyEntityType, 1);
			assert.isTrue(entity.isRemoved(), "Entity was not marked as 'removed' when removed from a store.");
		})
		.then(function() {
			dfd.resolve();
		}, function(err) {
			dfd.reject(err);
		});
	return dfd;
}

registerSuite({
	name: "data/EntityManager",
	// before each test executes
	beforeEach: function() {
		// Do something...
	},

	create__same_entity_twice: function() {
        @datatype("MyEntity")
		class MyEntity extends Entity {
            @field() id = "";
			@field() name = "";
        }
        var data1 = { id: "1" },
			data2 = { id: "1" },
			data3 = { id: "2" },
            em = new EntityManager(),
			created1,
			created2,
			created3;

		created1 = em.create(MyEntity, data1);
		created2 = em.create(MyEntity, data2);
		created3 = em.create(MyEntity, data3);
		assert.isTrue(created1 === created2, "Two instances of the same entity created.");
		assert.isFalse(created2 === created3, "Same instance returned for different IDs");
	},

	/**
     * Tests for:
     * e1 = entity({id:  1 });
     * e2 = entity({id: "1"});
     * Expected outcome:
     * e1 === e2 IDs are used as hash keys and hash keys are always
     * translated to strings by JavaScript.
     */
    create__IntId_same_as_StringId: function () {
        @datatype("Ctor") class Ctor extends Entity {};
		var em = new EntityManager();
        var e1 = em.create(Ctor, {id:  1 });
        var e2 = em.create(Ctor, {id: "1"});
        assert.isTrue(e1 === e2);
        em.destroy();
    },


    create__from_resolved_ids: function () {
		var em = new EntityManager();

		// Scenario 1:
        // Constructor assigns a different ID than passed via object literal
        // to create(). Expect to ignore ID passed to create()

        // @datatype decorator
        @datatype("Ctor1")
        class Ctor1 extends Entity {
            @field({alias: "name"}) p = "";
			constructor() {
                super();
				this.id = "a";
			}
        }
        //entity("TestEntity")(Ctor1);
        var e1   = em.create(Ctor1, {id: "b"});
        var e1_a = em.lookup(Ctor1, "a"); // returns undefined or another entity
        var e1_b = em.lookup(Ctor1, "b"); // returns e
        assert.isTrue(e1 === e1_b, "Scenario 1: The entity returned for 'b' was not identical to the entity registered with id 'b'");
        assert.isTrue(e1_a === undefined, "Scenario 1: It was not expected to find some entity id 'a'");
        assert.isTrue(e1_b.id === "b", "Scenario 1: ID assigned in constructor has not been overwritten to match the ID used to register the entity.");
		em.clear();

        //Scenario 2:
        // No ID has been passed to create(). Manager is expected to inspect
		// the object that's created and use the ID that's being set after
		// entity construction.
        @datatype("TestEntity")
        class Ctor2 extends Entity {
            constructor() {
                super();
				this.set("id", "a");
			}
        }
        var e2  = em.create(Ctor2);
        var e2_ = em.lookup(Ctor2, "a"); // returns e
        assert.isTrue(e2 === e2_, "Scenario 2: e2 === e2_");
		em.clear();

        //Scenario 3:
        // ID has been assigned via entity()-factory only (most common scenario).
        // It is expected that entity() sets the id property on the instance
        // created via Ctor.
        @datatype("Ctor3")
        class Ctor3 {
            // no id assigned by constructor.
        }
        var e3  = em.create(Ctor3, {id: "b"});
        var e3_ = em.lookup(Ctor3, "b"); // returns b
        assert.isTrue(e3 === e3_, "Scenario 3: e3 === e3_");
        assert.isTrue(e3.id === "b", "Scenario 3: e3.id === 'b'");
        assert.isTrue(e3_.id === "b", "Scenario 3: e3_.id === 'b'");
		em.clear();

        // Scenario 4 (most recommended):
        // ID has been assigned via entity()-factory. Constructor evaluates
        // arguments.
        @datatype("Ctor4")
        class Ctor4 {
            constructed(data) {
                this.id = data.id;
            }
        };
        var e4  = em.create(Ctor4, {id: "b"});
        var e4_ = em.lookup(Ctor4, "b");
        assert.isTrue(e4 === e4_, "Scenario 4: e4 === e4_");
        assert.equal(e4.id, "b", "Scenario 4: e4.id === 'b'");
        assert.equal(e4_.id, "b", "Scenario 4: e4_.id === 'b'");
		em.clear();
        em.destroy();
    },


	lookup__type_and_id: function() {
        @datatype("E")
        class E extends Entity {
            id = null;
        }
        var em = new EntityManager();
		var e = em.create(E, {id: 1});

		assert.isTrue(em.lookup(E, "1") === e, "Entity returned by lookup does not match the one created.");
		assert.isFalse(em.lookup(E, "2") === e, "Entity with ID 1 returned when ID 2 was looked up.");
		assert.strictEqual(em.lookup(E, "2"), undefined, "Magic. Found something I never registered.");
	},

	lookup__missing: function () {
        @datatype("Ctor") class Ctor {}
        var em = new EntityManager();
        var result = em.lookup(Ctor, 2);
        assert.isTrue(result === undefined, "result === undefined");
    },

	detach: function() {
        @datatype("E")
        class E extends Entity {
            id = null;
        }
		var em = new EntityManager();
        var e = em.create(E, {id: 1});

		assert.isTrue(em.lookup(e) === e, "Entity not found. It should have been attached when created.");
		assert.isTrue(e.$context !== null, "Entity's entity manager should not be null prior to applying 'detach()' because we want to test whether 'detach()' sets it to null.");
		em.detach(e);
		assert.strictEqual(e.$context, null, "Entity's entity manager should be 'null' after detaching the entity.");
		assert.isFalse(em.lookup(e) === e, "lookup() finds detached entity. It shouldn't.");
		assert.strictEqual(em.lookup(e), undefined, "Expected 'undefined' when looking up detached entity.");
	},

	detach_twice: function () {
        @datatype("Ctor")
        class Ctor {}
		var em = new EntityManager();
        var e = em.create(Ctor, {id: 1});
        var e1 = em.lookup(Ctor, 1);
        var e2 = null;
        var false_ = null;

        em.detach(e);
        em.detach(e); // Should not result in errors...
    },

	entity_inheritance: function () {
        @datatype("Parent")
        class Parent {
            constructor(props) {
                Object.assign(this, props);
            }
        };
        @datatype("Child")
        class Child extends Parent {
            constructor(props) {
                super(props);
                Object.assign(this, props);
            }
        };
        var em = new EntityManager(),
            instanceOfP = em.create(Parent, {id: 1}),
            instanceOfC = em.create(Child,  {id: 1}),
            lookupP = em.lookup(Parent, 1),
            lookupC = em.lookup(Child, 1);

        assert.isTrue(lookupP !== lookupC, "Test 1");
        assert.isTrue(lookupP === instanceOfP, "Test 2");
        assert.isTrue(lookupC === instanceOfC, "Test 3");
    }
});
