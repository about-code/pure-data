/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin.
 * @module test/unit/guide/modeling-data
 */
"use strict";
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {datatype, field} from "pure/data/decorators";
import {EntityManager} from "pure/data/EntityManager";
import {Model} from "pure/data/Model";

@datatype("Person")
class Person extends Model {
    @field({ignore: "GET,POST,DELETE"}) id = null;
    @field({alias: "name"}) firstname = "";
    @field({alias: "surname"}) lastname = "";
    @field({type: "object", dtype: "_self", inverse: "children"}) parent = "";
    @field({type: "array",  dtype: "_self"}) children = [];
    @field({type: "object", dtype: "_self", flags: "FK"}) loves = null;
}

/**
 * TODO: Update to fit latest API
 */
registerSuite({
	name: "Guide Examples",

	exLazyLoadFromStoreDangerous: function() {
		var manager = new EntityManager();
			alice = manager.create(Person, {
				id: 1,
				name: "Alice",
				children: []
			}),
			result;
		Person.prototype.$store = new MemoryStore({
			Model: Person
		});
		Person.prototype.$store.put({
			id: 2,
			parent: 1,
			name: "Lucy"
		});
		Person.prototype.$store.put({
			id: 3,
			parent: 1,
			name: "Simon"
		});
		result = alice.field("children").store().getSync(3);
		assert.isTrue(result.isInstanceOf && result.isInstanceOf(Person), "\"result\" not a Person");
		assert.isTrue(alice.get("children").indexOf(result) >= 0, "Expected alice.children to contain items loaded via alice.field(\"children\").store().");
	},

	exLazyLoadFromStoreCorrect: function() {
		var manager = new EntityManager(),
			alice = manager.create(Person, {
				id: 1,
				name: "Alice",
				children: []
			}),
			lucy = manager.create(Person, {
				id: 2,
				parent: 1,
				name: "Lucy"
			}),
			simon = manager.create(Person, {
				id: 3,
				parent: 1,
				name: "Simon"
			}),
			result;
		Person.prototype.$store = new MemoryStore({
			Model: Person,
		});
		Person.prototype.$store.put(lucy);
		Person.prototype.$store.put(simon);
		result = alice.field("children").store().getSync(3);
		assert.isTrue(result.isInstanceOf && result.isInstanceOf(Person), "\"result\" not a Person");
		assert.isTrue(alice.get("children").indexOf(result) >= 0, "Expected alice.children to contain items loaded via alice.field(\"children\").store().");
	}
});
