/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 * @module test/unit/guide/modeling-data
 */
define([
	"intern!object",
	"intern/chai!assert",
	"dojo/_base/declare",
	"dstore/Memory",
	"pure/data/Model",
	"pure/data/EntityManager"
], function(registerSuite, assert, declare, MemoryStore, Model, Session) {

	var Person;

	registerSuite({
		name: "Guide Examples",
		// before each test executes
		beforeEach: function() {
			Person = declare([Model], {
				$name: 'Person',
				$schema: {
					id:        {default: null, scenario: 'PUT'},
					firstname: {default: '', plain: 'name'},
					lastname:  {default: '', plain: 'surname'},
					parent:    {default: '', type: "object", dtype: "_self", inverse: "children"},
					children:  {default: [], type: "array", dtype: "_self"},
					loves:     {default: null, type: "object", dtype: "_self", flags: "FK"}
				}
			});
		},

		/**
		 * TODO: Example does only work if all associated objects have been
		 * created with the default session on the Model prototype.
		 * Because when passing plain objects to store.put() then the store
		 * invokes Model._restore in a context where no other session, than the
		 * one on the constructor prototype chain is accessible. Therefore it
		 * is recommended to not pass plain objects to store.put.
		 *
		 * See also exLazyLoadFromStoreCorrect
		 */
		exLazyLoadFromStoreDangerous: function() {
			var manager = Person.prototype.$entityManager,
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
			result = alice.property("children").store().getSync(3);
			assert.isTrue(result.isInstanceOf && result.isInstanceOf(Person), '"result" not a Person');
			assert.isTrue(alice.get("children").indexOf(result) >= 0, 'Expected alice.children to contain items loaded via alice.property("children").store().');
		},

		exLazyLoadFromStoreCorrect: function() {
			var session = Person.prototype.$entityManager,
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
			result = alice.property("children").store().getSync(3);
			assert.isTrue(result.isInstanceOf && result.isInstanceOf(Person), '"result" not a Person');
			assert.isTrue(alice.get("children").indexOf(result) >= 0, 'Expected alice.children to contain items loaded via alice.property("children").store().');
		}
	});
});
