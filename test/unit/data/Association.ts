/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 * @module test/unit/data/Association
 */
"use strict";
import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {shared} from "pure/lang/typescript";
import {EntitySet} from "pure/collection/collection";
import {datatype, field} from "pure/data/decorators";
import {Model, EntityManager, Association} from "pure/data/data";

registerSuite({
	name: "data/Association",
	// before each test executes
	beforeEach: function() { return; },
	afterEach: function() { return; },

	/**
	 * Tests for proper model update when an entity A which has been related
	 * to an entity B via a field B.b became unrelated to B, because
	 * field B.b has got assigned a new value/entity C. In this scenario
	 * A must be updated such that A[inverse(B.b)] does no longer hold a
	 * reference onto B while C[inverse(B.b)] must be updated such that it
	 * does hold a reference to B.
	 */

	one_many__change_related_entity: function() {
		// setup
        @datatype("Owner") class Owner extends Model {
            @field() id ="";
    		@field({type: "array", dtype: "Owned", inverse: "owner", flags: "FK"}) owns = [];
        }
        @datatype("Owned") class Owned extends Model {

    		@field() id = "";
    		@field({ type: "object", dtype: Owner, inverse: "owns", flags: "FK"}) owner = [];

        }

        var em = new EntityManager();
		var maggie = em.create(Owner, {id: "maggie", owns: []});
		var bart   = em.create(Owner, {id: "bart",   owns: []});
		var puppet = em.create(Owned, {id: "user1",  owner: maggie });

		// assert: preconditions
		assert.strictEqual(puppet.owner, maggie, "Puppet is expected to be owned by Maggie");
		assert.isTrue(maggie.owns.indexOf(puppet) >= 0, "Could not find puppet in the list of things owned by Maggie");
		assert.strictEqual(bart.owns.length, 0, "Bart is not expected to own anything at this point");

		// act: change user's membership from admin1 group to admin2.
		puppet.owner = bart;

		// assert: postconditions
		assert.isTrue(puppet.owner === bart, "Bart is expected to own the puppet now");
		assert.strictEqual(bart.owns.indexOf(puppet), 0, "Could not find puppet in the list of things owned by Bart.");
		assert.strictEqual(maggie.owns.indexOf(puppet), -1, "Maggie is not expected to own anything at this point.");
	},

	/**
	 * Tests for proper updates to a set of related entities. E.g. when
	 * overwriting a collection of owners of a thing with a new collection
	 * of owners, then all entities in the old collection which aren't
	 * elements of the new collection must be updated such that their inverse
	 * field ("owns") does not indicate that they own something they aren't
	 * owner of anymore.
	 */
	many_many__change_related_entities: function () {
		// setup
        @datatype("Owner") class Owner extends Model {
    		@field()	id = "";
    		@field({type: "array", dtype: "Owned", inverse: "owner"}) owns = [];
        }
        @datatype("Owned") class Owned extends Model {
            @field()	id = "";
    		@field({type: "array", dtype: "Owner", inverse: "owns", flags: "FK"}) owner = [];
        }

		var manager = new EntityManager();
		var maggie  = manager.create(Owner, {id: "maggie",  owns:  ["puppet1", "puppet2"]});
		var bart    = manager.create(Owner, {id: "bart",    owns:  ["puppet2"]});
		var puppet1 = manager.create(Owned, {id: "puppet1", owner: ["maggie"]});
		var puppet2 = manager.create(Owned, {id: "puppet2", owner: ["maggie", "bart"]});

		// act
		puppet2.owner = EntitySet.create(Owner, manager, [bart]);

		// assert
		assert.strictEqual(maggie.owns.length,   1, "puppet2 should have been removed from things owned by maggie");
		assert.strictEqual(bart.owns.length,     1, "Bart should own puppet2, only");
		assert.strictEqual(puppet1.owner.length, 1, "puppet1 should only be owned by Maggie");
		assert.strictEqual(puppet2.owner.length, 1, "Puppet2 should only be owned by Bart");
	},

	many_many__change_related_to_null: function () {
        @datatype("Owner") class Owner extends Model {
            @field() id = "";
            @field({type: "array", dtype: "Owned", inverse: "owner"}) owns = [];

        }
        @datatype("Owned") class Owned extends Model {
            @field() id = "";
            @field({type: "array", dtype: "Owner", inverse: "owns", flags: "FK"}) owner = [];
        }

		var manager = new EntityManager();
		var maggie  = manager.create(Owner, {id: "maggie",  owns:  ["puppet1", "puppet2"]});
		var bart    = manager.create(Owner, {id: "bart",    owns:  ["puppet2"]});
		var puppet1 = manager.create(Owned, {id: "puppet1", owner: ["maggie"]});
		var puppet2 = manager.create(Owned, {id: "puppet2", owner: ["maggie", "bart"]});

		assert.strictEqual(maggie.owns.length,   2, "Maggie should own puppet1 and puppet2");
		assert.strictEqual(bart.owns.length,     1, "Bart should own exactly 1 thing");
		assert.strictEqual(puppet1.owner.length, 1, "Puppet1 should only be owned by Maggie");
		assert.strictEqual(puppet2.owner.length, 2, "Puppet2 should be owned by Maggie and Bart");

		// act
		puppet2.owner = null;

		// assert
		assert.strictEqual(maggie.owns.length, 1, "Maggie should own only puppet1");
		assert.strictEqual(bart.owns.length,   0, "Bart should own nothing, anymore");

		// act: restore original ownerships
		puppet2.owner = EntitySet.create(Owner, manager, [maggie, bart]);

		// assert
		assert.strictEqual(maggie.owns.length,   2, "Maggie should own puppet1 and puppet2 again");
		assert.strictEqual(bart.owns.length,     1, "Bart should own exactly 1 thing again");
		assert.strictEqual(puppet1.owner.length, 1, "Puppet1 should only be owned by Maggie again");
		assert.strictEqual(puppet2.owner.length, 2, "Puppet2 should be owned by Maggie and Bart again");
	}
});
