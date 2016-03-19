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
import {Inject} from "pure/di/Inject";
import {datatype, field} from "pure/data/decorators";
import {Entity, EntityManager, Model, Association} from "pure/data/data";
import "../mocks/mocks";
//"use strict";

@datatype("TestGlobalPerson")
class Person extends Model {
    @field() id = null;
    @field() familyname = null;
    @field() firstname = null;
    @field({
        setValue: function(value) { return; },
        getValue: function() { return; }
    }) fullname;
    @field() age = null;
    @field() address = { city: null };
    @field() parents = [];
    @field() children = [];
    @field() loves = [];
    @field() birthdate = {
        setValue: function() { return; },
        getValue: function() { return; }
    };
}

registerSuite({
    name: "data/Model",
    // before each test executes
    beforeEach: function () {
        return;
    },

    instantiation__entities: function() {
        @datatype("People")
        class People extends Model {
            @field() id = null;
        }
        @datatype("Person")
        class Person extends Model {
            @field() id = null;
            @field() name = "";
            @field({dtype: "Person"}) loves;
        }
        @datatype("Male", Person)
        class Male extends Person {
            @field() id = null;
        }
        var manager = new EntityManager(),
            instance1 = null,
            instance2 = null,
            instance3 = null,
            instance4 = null;

        instance1 = manager.create(Person, {id: 3, name: "Somebody"});
        instance2 = manager.create(Person, {id: 3, name: "Somebody Identical"});
        instance3 = manager.create(People, {id: 3, name: "Somebody"});
        instance4 = manager.create(Male,   {id: 3, name: "Somebody"});
        assert.isTrue(instance1 === instance2, "instance 1 and instance 2 should be found to be equal when using ===");
        assert.isTrue(instance2 !== instance3, "Person 3 is not the same as People 3 ");
        assert.isTrue(instance2 !== instance4, "Person 3 is not the same as Male 3");
        assert.isTrue(instance3 !== instance4, "People 3 is not the same as Male 3");
    },

    associations__parse_11: function() {

        @datatype("User") class User extends Model {
            @field() id = null;
            @field({type: "object", dtype: "Group", inverse: "user" }) group = null;
        }
        @datatype("Group") class Group extends Model {
            @field() id = null;
            @field({type: "object", dtype: User, inverse: "group"}) user = null;
        }

        var manager = new EntityManager();
        var user, user_assoc;
        var group, group_assoc;

        user = manager.create(User, {id: "u1", group: {id: "g1", user: "u1"}});

        assert.strictEqual(user.associations().length, 1, "Incorrect number of associations created for 'User'");
        assert.strictEqual(user.get("group").associations().length, 1, "Incorrect number of associations created for 'Group'");
        user_assoc = user.associations()[0];
        group_assoc = user.get("group").associations()[0];

        assert.instanceOf(user_assoc, Association, "Item [0] in user._associations not an instance of 'Association'");
        assert.instanceOf(group_assoc, Association, "Item [0] in group._associations not an instance of 'Association'");
        assert.strictEqual(user_assoc.kind, user_assoc.I_I);
        assert.strictEqual(group_assoc.kind, group_assoc.I_I);
        assert.strictEqual(user_assoc.id, "User:group:Group:user");
        assert.strictEqual(group_assoc.id, "Group:user:User:group");
    },

    associations__parse_1n: function() {
        console.warn("Not yet implemented.");
    },

    associations__parse_n1: function() {
        console.warn("Not yet implemented.");
    },

    associations__parse_mn: function() {
        console.warn("Not yet implemented.");
    },

    /**
     * Tests for
     * - Model.associations() returning an object with associations of
     *   an instance's direct type as well as all transitive parent types.
     *
     *   +--------+          +---------+
     *   | Super  |          | Related |
     *   +--------+          +---------+
     *   | pSuper |--------->|  super  |
     *   +--------+       o->|  sub    |
     *       A           /   +---------+
     *       |          /
     *    +------+     /
     *    | Sub  |    /
     *    +------+   /
     *    | pSub |--o
     *    +------+
     *
     */
    associations__get_all_including_inherited: function() {
        @datatype("Superclass")
        class Super extends Model {
            @field() id = null;
            @field({type: "object", dtype: "Related", inverse: "pSuper" }) pSuper = null;
        }
        @datatype({name: "Subclass", base: _super})
        class Sub extends Super {
            @field() id = null;
            @field({type: "object", dtype: "Related", inverse: "pSub"}) pSub = null;
        }
        @datatype("Related")
        class Related extends Model {
            @field({type: "object", dtype: Super}) pSuper = null;
            @field({type: "object", dtype: Sub}) pSub = null;
        };
        var manager = new EntityManager();
        var superInstance = manager.create(Super, {id: "1"});
        var subInstance = manager.create(Sub, {id: "1"});
        var superAssocs = superInstance.associations();
        var subAssocs = subInstance.associations();

        assert.strictEqual(superAssocs.length, 1, "Only one association expected for Superclass instance but got " + superAssocs.length);
        assert.strictEqual(subAssocs.length, 2, "Two associations expected for Subclass instance but got " + subAssocs.length);
    },

    /**
     * Imagine there's an owner entity holding a reference to some owned
     * entity. If we remove the owned entity (resource) via
     * entity.remove() we want all references   owner.owns -> owned
     * being deleted from owner.owns, too.
     */
    associations__propagate_resource_delete_1n: function () {
        @datatype("Owner") class Owner extends Model {
            @field() id = "";
            @field({type: "array", dtype: "Owned", inverse: "ownedBy"}) owns = [];
        }
        @datatype("Owned") class Owned extends Model {
            @field() id = "";
            @field({type: "object", dtype: Owner, inverse: "owns"}) ownedBy = null;
        }
        var maggie, puppet;
        var manager = new EntityManager();

        maggie = manager.create(Owner, {id: 1, owns: [2]});
        puppet = manager.create(Owned, {id: 2, ownedBy: 1});

        assert.strictEqual(maggie.owns[0], puppet, "Expected maggie to own puppet.");
        assert.strictEqual(puppet.ownedBy, maggie, "Expected puppet to be owned by maggie.");

        // remove puppet resource
        puppet.remove();

        // expect puppet to have been removed from maggie.owns
        assert.strictEqual(maggie.owns.length, 0, "Puppet is still owned by maggie although there's no puppet anymore.");
    },

    /**
     * Imagine there's an owner entity holding a reference to some owned
     * entity. If we remove an item from the list of what owner owns, then
     * we want the item in turn not to refer to owner any longer via its
     * ownedBy field (inverse direction);
     *
     * Note that in contrast to "propagate_resource_delete", the resource
     * may remains existent in this .
     */
    associations__propagate_reference_delete_1n: function () {
        @datatype("Owner") class Owner extends Model {
            @field() id = "";
            @field({type: "array", dtype: "Owned", inverse: "ownedBy"}) owns = [];
        }
        @datatype("Owned") class Owned extends Model {
            @field() id = "";
            @field({type: "object", dtype: Owner, inverse: "owns"}) ownedBy = null;;
        }
        var maggie, puppet;
        var manager = new EntityManager();

        maggie = manager.create(Owner, {id: 1, owns: [2]});
        puppet = manager.create(Owned, {id: 2, ownedBy: 1});

        assert.strictEqual(maggie.owns[0], puppet, "Expected maggie to own puppet the puppet.");
        assert.strictEqual(puppet.ownedBy, maggie, "Expected puppet to be owned by maggie.");

        // remove ownership between maggie and puppet. Expect changes on
        // maggie to be reflected inversely in puppet.
        maggie.owns.splice(0, 1);
        assert.isTrue(puppet.ownedBy === null, "Puppet still owned by maggie although maggie does not own puppet anymore.");
    },

    /**
     * Tests for
     * - fields being initializable via constructor
     * - non-schema fields being definable via constructor (these won't be serialized, though)
     * - default values being ignored when there's a default value provided with the constructor.
     */
    instantiation__apply_props: function () {
        @datatype("Person")
        class Person extends Model {
            @field() familyname = "Simpson";
            @field() firstname = null;
            @field() age = 0;
            @field() address = {city: null};
            @field() parents = [];
            @field() children = [];
        }
        var manager = new EntityManager();
        var instance = manager.create(Person, {firstname: "Homer", age: 40, hobbies: "watching TV"});

        assert.strictEqual(instance.get("firstname"), "Homer", "Schema-declared field was not initialized with value provided with the constructor");
        assert.strictEqual(instance.get("hobbies"), "watching TV", "Properties provided via constructor are not mixed in");
        assert.strictEqual(instance.get("age"), 40, "Constructor default values (higher priority) are overwritten by schema default values (lower priority)");
    },

    instantiation__performance_create_100: function() {
        @datatype("Person")
        class Person extends Model {
            @field() familyname = "Simpson";
            @field() firstname = "Homer";
            @field({ ignore: "PUT, DELETE"}) age = 40;
            @field({ ignore: "DELETE" }) address = {city: null};
            @field() parents = ["Abe"];
            @field() children = ["Bart", "Lisa", "Maggie"];
        }
        var manager = new EntityManager(),
            i = 0;
        for (i = 0; i < 100; i += 1) {
            manager.create(Person);
        }
    },


    instantiation__performance_create_1000: function() {
        @datatype("Person")
        class Person extends Model {
            @field() familyname = "Simpson";
            @field({ ignore: false }) firstname = "Homer";
            @field({ ignore: "PUT, DELETE"}) age = 40;
            @field({ ignore: "DELETE", flags: "someFlag" }) address = { city: null};
            @field({ ignore: true, type: "array", dtype: "Person"}) parents = ["Abe"];
            @field({ type: "array", dtype: "Person" }) children = ["Bart", "Lisa", "Maggie"];
        }
        var i = 0,
            manager = new EntityManager();
        for (i = 0; i < 1000; i += 1) {
            manager.create(Person, {id: i, age: i, address: "My street X", parents: [1,2,3]});
        }
    },

    instantiation__performance_Model_new_100_identities_10: function() {
        @datatype("Person")
        class Person extends Model {
            @field() familyname = "Simpson";
            @field() firstname = "Homer";
            @field({ ignore: "PUT, DELETE"}) age = 40;
            @field({ ignore: "DELETE" }) address = {city: null};
            @field() parents = ["Abe"];
            @field() children = ["Bart", "Lisa", "Maggie"];
        }
        var i = 0,
            manager = new EntityManager();
        for (i = 0; i < 100; i += 1) {
            manager.create(Person, {id: i%10, age: i});
        }
    },


    /**
     * Tests for
     * - correct rendering of plain JS object from a Model instance...
     */
    serialization__ignore: function() {
        @datatype("Person")
        class Person extends Model {
            @field() familyname = "Simpson";
            @field({ ignore: false }) firstname = "Homer"; // Test: always serialized
            @field({ ignore: "PUT, DELETE"}) age = 40; // Test: not serialized for PUT
            @field({ ignore: "DELETE", flags: "someFlag" }) address = { city: null};   // Test: associated (plain) objects get serialized...;
            @field({ ignore: true}) parents = ["Abe"];
            @field({ ignore: false, type: "array", dtype: "Person" }) children = ["Bart", "Lisa", "Maggie"];
        };
        var manager = new EntityManager();
        var instance = manager.create(Person);
        var data = null;

        // test scenario
        data = instance.serialize({scenario: "PUT"});
        assert.strictEqual(data.familyname, "Simpson");
        assert.strictEqual(data.firstname, "Homer");
        assert.isTrue(typeof data.age === "undefined", "field configured to be serialized only for scenario 'GET,POST' but was serialized for 'PUT'");
        assert.isTrue(typeof data.parents === "undefined", "field configured to be never serialized but was serialized for 'PUT'");
        assert.strictEqual(data.children.length, 3, "failed to render array 'children'");
    },

    serialization__depth_0: function() {
        var manager = new EntityManager();
        var homer = manager.create(Person, {id: 1, familyname: "Simpson", firstname: "Homer"});
        var data = homer.serialize({serializeDepth: 0});
        assert.strictEqual(data, homer.id, "Serialization depth of 0 did not resolve to entity id. Entity was serialized with depth 1 or deeper");
    },

    serialization__depth_1: function() {
        var manager = new EntityManager();
        var homer = manager.create(Person, {id: 1, familyname: "Simpson", firstname: "Homer"});
        var bart  = manager.create(Person, {id: 2, familyname: "Simpson", firstname: "Bart"});
        var data = null;
        homer.get("children").push(bart);
        data = homer.serialize({serializeDepth: 1});
        assert.strictEqual(data.children[0], 2, "Bart entity was not serialized to ID");
    },

    serialization__depth_2: function() {
        var manager = new EntityManager();
        var homer = manager.create(Person, {familyname: "Simpson", firstname: "Homer"});
        var bart  = manager.create(Person, {familyname: "Simpson", firstname: "Bart"});
        var data = null;

        homer.get("children").push(bart);
        data = homer.serialize();

        assert.strictEqual(data.firstname, "Homer");
        assert.strictEqual(data.children[0].firstname, "Bart", "Referenced model classes not serialized");
    },

    serialization__depth_3_circular_references: function() {
        var manager, homer, data;
        manager = new EntityManager();
        homer = manager.create(Person, {
            id: "1",
            familyname: "Simpson",
            firstname: "Homer"
        });
        data = null;

        homer.get("loves").push(homer);
        data = homer.serialize({serializeDepth: 3});

        assert.strictEqual(data.firstname, "Homer");
        assert.strictEqual(data.loves[0].firstname, "Homer");
        assert.strictEqual(data.loves[0].loves[0].firstname, "Homer");
        assert.isTrue(data.loves[0].loves[0].loves[0].firstname === undefined);
        assert.isTrue(data.loves[0].loves[0].loves[0] === "1");
    },

    /**
     * Note: A warning about having reached the maximum number of cycles
     * will be issued to the console. This warning is expected.
     */
    serialization__depth_MAX_circular_references_array: function() {
        var MAX = 25, // to be aligned with implementation of Model.serialize()
            manager = new EntityManager(),
            homer = manager.create(Person, {
                id: "1",
                familyname: "Simpson",
                firstname: "Homer",
            }),
            data = null;

        homer.get("loves").push(homer);

        // MAX DEPTH
        data = homer.serialize();
        var x = data, i;
        for (i = 0; i < MAX; i += 1) {
            if (i < MAX-1) {
                assert.strictEqual(x.firstname, "Homer", "(" + i + ")");
                assert.strictEqual(x.loves[0].firstname, "Homer", "(" + i + ") loves (" + (i+1) + ") but (" + (i+1) + ") not as expected");
            } else {
                assert.isTrue(x.loves[0].firstname === undefined, "(" + i + ")");
                assert.isTrue(x.loves[0] === "1", "(" + i + ") loves (" + (i+1) + ")  but (" + (i+1) + ") not as expected");
            }
            x = x.loves[0];
        }
    },

    /**
     * Note: A warning about having reached the maximum number of cycles
     * will be issued to the console. This warning is expected.
     */
    serialization__depth_MAX_circular_references_object: function() {
        var MAX = 25, // to be aligned with implementation of Model.serialize()
            manager = new EntityManager(),
            homer = manager.create(Person, {
                id: "1",
                familyname: "Simpson",
                firstname: "Homer",
                loves: null
            }),
            data = null;

        homer.set("loves", homer);

        // MAX DEPTH
        data = homer.serialize();
        var x = data, i;
        for (i = 0; i < MAX; i += 1) {
            if (i < MAX-1) {
                assert.strictEqual(x.firstname, "Homer", "(" + i + ")");
                assert.strictEqual(x.loves.firstname, "Homer", "(" + i + ") loves (" + (i+1) + ") but (" + (i+1) + ") not as expected");
            } else {
                assert.isTrue(x.loves.firstname === undefined, "(" + i + ")");
                assert.isTrue(x.loves === "1", "(" + i + ") loves (" + (i+1) + ")  but (" + (i+1) + ") not as expected");
            }
            x = x.loves;
        }
    },

    serialization__alias: function() {
        @datatype("Person")
        class Person extends Model {
            @field({ alias: "surname" })
            familyname = "Simpson";
        }
        var manager = new EntityManager();
        var instance = manager.create(Person);
        var data = instance.serialize();

        assert.isTrue(data.hasOwnProperty("surname") && data.surname === "Simpson", "'familyname' should have been mapped to 'surname'");
        assert.isTrue(data.familyname === undefined, "'familyname' still exists although it should have been mapped to 'surname'");
    },

    /**
     * Test for correct mapping from properties of plain entity data objects
     * onto the entity instance fields.
     */
    deserialization__alias: function() {
        @datatype("Person")
        class Person extends Model {
            @field({alias: "surname" })
            familyname = "";
        };
        var manager = new EntityManager();
        var instance = manager.create(Person, {surname: "Simpson"});

        assert.isFalse(instance.hasOwnProperty("surname"), "Property 'surname' exists on entity instance where it should only exist as 'familyname'");
        assert.strictEqual(instance.familyname, "Simpson", "Value of plain property 'surname' has not been mapped to entity field 'familyname'");
    },

    deserialization__parser: function() {
       @datatype("Person")
       class Person extends Model {
            @field({
                parser: function(value) {
                    if (value == "unparsed") {
                        return "parsed";
                    }
                }
            }) p1;

        }
        var data = {
                p1: "unparsed"
            },
            manager = new EntityManager(),
            instance = manager.create(Person, data);
        assert.strictEqual(instance.get("p1"), "parsed");
    },

    /**
     * Tests that the post-construction callback of a type referenced as 'dtype'
     * is getting the value returned from a parser declared via the 'parser'
     * field config. The parser itself got the raw value from data.
     * => entity[p] = new ctor(parser(data[p]));
     */
    deserialization__parser_before_constructor: function() {
        var actual = "",
            data = {
                obj: {
                    id: "unparsed"
                }
            };

        @datatype("Foo")
        class Foo {
            constructed (data) {
                actual = data.id;
            }
        }
        @datatype("Person")
        class Person extends Model {
            @field({
                dtype: Foo,
                parser: function(value) {
                    value.id = "parsed";
                    return value;
                }
            }) obj;

        }

        var manager = new EntityManager(),
        instance = manager.create(Person, data);
        assert.strictEqual(actual, "parsed");
    },

    /**
     * Tests for deserialization of fields, whose "dtype" config refers
     * to "_self", that is, to the type described via the schema.
     * E.g. a Person class might have a field "children" who are
     * Persons themselves. Hence the children-Property's "dtype" refers to
     * "_self".
     */
    deserialization__dtype_self_recursive_constructor: function() {
        @datatype("Person")
        class Person extends Model {
            @field() familyname = "Simpson";
            @field() firstname = "Homer";
            @field() age = 40;
            @field() address = { city: null };
            @field({ dtype: "Person" }) child; // Child is a Person, too
        }
        var data = {
                familyname: "Simpson",
                firstname: "Marge",
                age: 3,
                address: {
                    city: "Springfield"
                },
                child: {
                    familyname: "Simpson",
                    firstname: "Maggie",
                    age: 3
                },
                parent: null
            },
            manager = new EntityManager(),
            instance = null;

        instance = manager.create(Person, data);
        assert.strictEqual(instance.familyname, data.familyname);
        assert.strictEqual(instance.firstname, data.firstname);
        assert.strictEqual(instance.age, data.age);
        assert.strictEqual(instance.address.city, data.address.city);
        assert.isTrue(instance.child instanceof Person);
        assert.strictEqual(instance.child.familyname, data.child.familyname);
        assert.strictEqual(instance.child.firstname, data.child.firstname);
        assert.strictEqual(instance.child.age, data.child.age);
        assert.strictEqual(instance.child.child, undefined);
    },

    deserialization__dtype_constructor_is_simple: function() {
        @datatype("Pet")
        class Pet extends Model {
            @field() id = null;
            @field() name = null;
            @field() kind = null;
        }
        @datatype("Person")
        class Person extends Model {
            @field() id = null;
            @field() familyname = null;
            @field() firstname = null;
            @field({ dtype: Pet }) pet = null;
        }
        var data = {
                id: 1,
                familyname: "Simpson",
                firstname: "Homer",
                pet: {
                    id: 1,
                    kind: "dog",
                    name: "Knecht Ruprecht"
                }
            },
            manager = new EntityManager(),
            deserialized;

        deserialized = manager.create(Person, data);
        assert.isTrue(deserialized.get("pet") !== undefined, "pet field has not been defined.");
        assert.instanceOf(deserialized.get("pet"), Pet, "Expected 'deserialized.pet' being instance of 'Pet'");
        assert.strictEqual(deserialized.get("pet").kind, "dog", "Expected 'deserialized.pet.kind' to be 'dog'");
        assert.strictEqual(deserialized.get("pet").name, "Knecht Ruprecht");
    },

    /**
     * Tests instantiation of Model instances for properties in 'data'
     * which have been configured with a 'dtype' of type Model in the
     * corresponding schema.
     */
    deserialization__dtype_constructor_is_a_Model: function() {
        @datatype("Pet")
        class Pet extends Model {
            @field() id = null;
            @field() name = null;
            @field() kind = null;
        }
        @datatype("Person")
        class Person  extends Model {
            @field() id = null;
            @field() familyname = null;
            @field() firstname
            @field({ dtype: Pet }) pet = null;
        }
        var data = {
                id: 1,
                familyname: "Simpson",
                firstname: "Homer",
                pet: {
                    id: 1,
                    kind: "dog",
                    name: "Knecht Ruprecht"
                }
            },
            manager = new EntityManager(),
            deserialized;
        deserialized = manager.create(Person, data);
        assert.isTrue(deserialized.get("pet") !== undefined, "pet field has not been defined.");
        assert.instanceOf(deserialized.get("pet"), Pet, "Expected 'deserialized.pet' being instance of 'Pet'");
        assert.instanceOf(deserialized.get("pet"), Model, "Expected 'deserialized.pet' being instance of 'Model'");
        assert.strictEqual(deserialized.get("pet").get("kind"), "dog", "Expected 'deserialized.pet.kind' to be 'dog'");
        assert.strictEqual(deserialized.get("pet").get("name"), "Knecht Ruprecht");
    },

    deserialization__dtype_for_type_is_object: function() {
        /*
         type: 'object' is the default assumption for fields with a
         'dtype'. So we actually do not need to implement a separate test
         case for that. This behaviour should be properly tested by test
         cases which test with config 'dtype', only.
         schema {
              p: {
                type: "object", // optional; assumed if there's 'dtype'
                dtype: function() {...}
              }
         }
        */
    },

    deserialization__dtype_for_type_is_array: function() {
        @datatype("Pet")
        class Pet extends Model {
            @field() id = null;
            @field() name = null;
            @field() kind = null;
        }
        @datatype("Person")
        class Person extends Model {
            @field() id = null;
            @field() familyname = null;
            @field() firstname = null;
            @field({ type: "array" }) pets = null;;
        }
        var data1 = {
                id: 1,
                familyname: "Simpson",
                firstname: "Homer",
                pets: { //  1: schema type is "array", plain type is "object"
                    id: 1,
                    kind: "dog",
                    name: "Knecht Ruprecht"
                }
            },
            manager = new EntityManager(),
            deserialized1;

        // In  1 we should see a warning about the type mismatch on the console
        deserialized1 = manager.create(Person, data1);
        assert.isTrue(type.isArray(deserialized1.get("pets")), "deserialized1.pets is not an 'array'.");
        assert.strictEqual(deserialized1.get("pets").length, 1, "Pet entity '1' was not made an element of 'deserialized1.pets'");
    },

    deserialization__dtype_for_type_not_object_nor_array: function() {
        console.warn("Not yet implemented.");
    },

    deserialization__flag_freeze: function() {
        console.warn("Not yet implemented.");
    },

    /**
     * Tests for an entity ID being deserialized into an entity object.
     * The object is said to be "incomplete", that is, there are no other
     * properties apart from the id-property with the value given in the raw
     * data (lazy loading may complete the entity).
     */
    deserialization__entity_id_to_entity_object: function() {
        @datatype("Car")
        class Car extends Model {
            @field() id = "";
            @field() manufacturer = "";
            @field() model = "";
        }
        @datatype("Person")
        class Person extends Model {
            @field() id = "";
            @field() name = "";
            @field({dtype: Car}) drives = null;;
        }
        var manager = new EntityManager();
        var personEntity = manager.create(Person, {
            id: 1,
            name: "Homer",
            drives: 2 // create a car entity with id 2 but no other properties
        });
        var carEntity = personEntity.get("drives");
        assert.isTrue(carEntity instanceof Car, "No car instance created for field 'drives'");
        assert.isTrue(carEntity.hasOwnProperty("manufacturer"), "Did expect field 'manufacturer' to exist on 'carEntity'.");
        assert.isTrue(carEntity.hasOwnProperty("model"), "Did expect field 'model' to exist on 'carEntity'");
    },

    /**
     * Tests for an array of entity IDs being deserialized into an array of
     * entity objects. The objects are said to be "incomplete", that is,
     * there are no other properties apart from the id-property with the
     * value given in the raw data (lazy loading may complete the entities).
     */
    deserialization__entity_ids_to_entity_array: function() {
        var manager = new EntityManager();
        @datatype("Car")
        class Car extends Model {
            @field() id = "";
            @field() manufacturer = "";
            @field() model = "";
        };
        @datatype("Person")
        class Person extends Model {
            @field() id = "";
            @field() name = "";
            @field({type: "array", dtype: Car}) drives = null;;
        };
        var personEntity = manager.create(Person, {
            id: 1,
            name: "Homer",
            drives: [2, 3] // create two car entities with id 2 but no other properties
        });
        var carEntities = personEntity.get("drives");

        assert.isTrue(type.isCollection(carEntities), "Didn't deserialize id-array to entity-array.");
        assert.strictEqual(carEntities.length, 2, "Deserialized array length didn't match raw array length.");
        assert.isTrue(carEntities[0] instanceof Car, "No car instance created for field 'drives[0]'");
        assert.isTrue(carEntities[1] instanceof Car, "No car instance created for field 'drives[1]'");
        assert.isTrue(carEntities[0].hasOwnProperty("manufacturer"), "Did expect field 'manufacturer' to exist on 'drives[0]'.");
        assert.isTrue(carEntities[1].hasOwnProperty("manufacturer"), "Did expect field 'manufacturer' to exist on 'drives[1]'.");
        assert.isTrue(carEntities[0].hasOwnProperty("model"), "Did expect field 'model' to exist on 'drives[0]'.");
        assert.isTrue(carEntities[1].hasOwnProperty("model"), "Did expect field 'model' to exist on 'drives[1]'.");

        personEntity.drives.push(4);
        assert.isTrue(carEntities[2] instanceof Car, "No car instance created when pushing new element to car collection.");
    },

    /**
     * Tests that circular references to the same entity resolving to the
     * same JavaScript object. The Test constructs a type Person who
     * has an attribute "loves" whose instances are also instances of
     * type Person. So if there are two persons with the same id, then,
     * only a single instance must be created.
     */
    deserialization__circular_references: function() {
        @datatype("Person")
        class Person extends Model {
            @field() id = null;
            @field() name = "";
            @field({dtype: "Person"}) loves;
            $serializeDepth:int = -1;
        }
        var data = {
                id: 1,  // ===========> person entity with id 1
                name: "Homer",      //           ^
                loves: {            //       identical
                    id: 2,          //           |
                    name: "Marge",  //           V
                    loves: {   // ====> person entity with id 1
                        id: 1,
                        name: "Mr. Simpson"
                    }
                }
            },
            manager = new EntityManager(),
            instance;

        instance = manager.create(Person, data);
        assert.isTrue(instance === instance.loves.loves);
        // in a sound data base there shouldn't be two entities with different
        // property values. Though it shows, how above structure would be handled.
        assert.strictEqual(instance.name, "Mr. Simpson");

        /**
         * Testing serialization deserialization roundtrip
         * Due to the circular object graph JSON.stringify will serialize
         * a nested structure down to MAX_DEPTH (see Model.serialize).
         * If we parse this back, again, we will receive a nested object
         * structure with individual distinct objects and depth MAX_DEPTH.
         *
         * If we create an Entity from that structure, we only expect there
         * to be two distinct entities, again.
         */
        var homer = manager.create(Person, JSON.parse(JSON.stringify(instance)));
        assert.isTrue(homer !== homer.loves);
        assert.isTrue(homer === homer.loves.loves);
        assert.isTrue(homer === homer.loves.loves.loves.loves);
        assert.isTrue(homer.loves === homer.loves.loves.loves);
        assert.isTrue(homer.loves === homer.loves.loves.loves.loves.loves);
    },


    /**
     * Tests for proper deserialization of an object hierarchy where
     * objects on a deeper nesting level recursively refer to a parent object
     * in the hierarchy.
     * Expected behaviour is, that IDs in a raw data object are deserialized
     * to entity instances and as such are created just once.
     */
    deserialization__circular_references_by_id: function() {
        @datatype("Person") class Person extends Model {
            @field() id = null;
            @field() name = "";
            @field({dtype: "Person"}) loves;
        }
        var data = {
                id: 1,
                name: "Homer",
                loves: {
                    id: 2,
                    name: "Marge",
                    // Test: if 'dtype' refers to an entity type, the value must
                    // be recognised as ID and deserialized to an entity
                    // instance with that ID. So instance.loves.loves must
                    // be an object reference to a Person entity with id 1.
                    loves: 1
                }
            },
            manager = new EntityManager(),
            instance;
        instance = manager.create(Person, data);
        assert.isTrue(instance === instance.loves.loves);
    },

    /*
     * Test case which tests for a  which may end up in an infinite
     * loop if deserialization is not properly implemented.
     *
     * Sources of inifinite loop might be:
     * - cloning where clone function can't deal with circular references
     * - calling Entity.new(ctor, props) where props is already some
     *   Entity.
     *
     * Why infinite loops?
     *
     * First there are User and Group which each have fields who are
     * configured to be a "dtype" of the other type. This is circularity
     * on the type level:
     *     Group <-----> User
     *
     * Second there are circular references on the instance level:
     * g1 hasMembers u1 which itself is memberOf g1.
     *
     *     g1 -> hasMembers -> u1 -> memberOf -> g1
     *
     * Third there is circularity on the instruction level by passing
     * g1 within
     *          u1 = manager.create(User, {... memberOf: g1})
     * even though g1.hasMembers already contains the entity singleton we
     * just attempt to instantiate with manager.create():
     *
     *     g1 = manager.create(Group, {id: "g1", hasMembers: ["u1"]})
     *     u1 = manager.create(User, {id: "u1", memberOf: g1})
     *        === manager.create(User, {id: "u1", memberOf: {hasMembers: ["u1"]}})
     *        === manager.create(User, {id: "u1", memberOf: {hasMembers: [ u1 ]}})
     *                                                              /----/
     * The reason why we can formally replace ["u1"] with u1 is, because the
     * deserializer created an instance u1 = User("u1") ealier when we
     * instantiated g1. It did so based on the "dtype" config for
     * Group.hasMembers.
     *
     */
    deserialization__circular_refs_on_type_instanc_and_instruct_level: function() {
        @datatype("User")
        class User extends Model {
            @field() id = "";
            @field({ type: "object", dtype: "Group" }) memberOf;
        }
        @datatype("Group")
        class Group extends Model {
            @field() id = "";
            @field({ type: "array", dtype: User }) hasMembers; /** Circularity/Interdependency on type level */
        }



        var manager = new EntityManager();
        /** Circularity on instance and instruction level */
        var g1 = manager.create(Group, {
            id: "g1",
            hasMembers: ["u1", "u2"]
        });

        var u1 = manager.create(User,  {id: "u1", memberOf: g1 });
        var u2 = manager.create(User,  {id: "u2", memberOf: g1 });

        assert.strictEqual(u1.memberOf, g1);
        assert.strictEqual(u1, u1.memberOf.hasMembers[0]);
        assert.strictEqual(u1, u1.memberOf.hasMembers[0].memberOf.hasMembers[0]);
        assert.strictEqual(u2, u2.memberOf.hasMembers[1]);
        assert.strictEqual(u2, u2.memberOf.hasMembers[1].memberOf.hasMembers[1]);
    },

    /**
     * Tests for
     * - setting the dirty flag for any changes after instantiation
     */
    isDirty: function() {
        var manager = new EntityManager(),
            instance = manager.create(Person, {firstname: "Homer"});

        // change to non-schema property
        instance.set("foo", "bar");
        assert.isFalse(instance.isDirty());

        // change schema field
        assert.strictEqual(instance.get("firstname"), "Homer");
        instance.set("firstname", "Marge");
        assert.strictEqual(instance.get("firstname"), "Marge");
        assert.isTrue(instance.isDirty());
    },

/*
    load__lazy: function() {
        @datatype("Car")
        class Car extends Model {
            @field() id = "";
            @field() manufacturer = "";
            @field() model = "";
        }
        @datatype("Person")
        class Person extends Model {
            @field() id = "";
            @field() name = "";
            @field({dtype: Car}) drives = null;
        }

        var previousInjectConf = Inject.reconfigure({
            "data/StoreFactory": {
                "default": {
                    value: { // Simple StoreFactory+IStore impl..
                        getStore: function() {
                            return {
                                get: function(id) {
                                    return new Promise(function(resolve, reject) {
                                        resolve({id: 1, manufacturer: "Audi", model: "TT" });
                                    });
                                },
                                put: function(entity) {},
                                remove: function(id) {}
                            };
                        }
                    },
                    singleton: true
                }
            }
        });
        var manager = new EntityManager(),
            deferred,
            partialCarEntity;
        var personEntity = manager.create(Person, {
            id: 1,
            name: "James",
            drives: 1 // car entity to be lazy loaded
        });

        assert.isTrue(personEntity.get("drives").hasOwnProperty("manufacturer"), "Did expect partial car entity to have all properties prior to lazy loading.");

        // Next we check if a (yet incomplete) car entity has been instantiated for the ID in personEntity.drives.
        // Lazy loading will complete this entity with data, making it immediately available to all other objects
        // referencing the same entity.
        assert.isTrue(personEntity.get("drives") instanceof Car, "Property 'drives': no entity created for entity reference.");
        assert.isTrue(personEntity.get("drives").hasOwnProperty("id"), "Expected partial car entity to have an ID.");

        deferred = this.async(2000);
        partialCarEntity = personEntity.get("drives");
        partialCarEntity.fetch().then(
            deferred.callback(function(completeCarEntity) {
                 assert.isTrue(completeCarEntity === partialCarEntity, "Result from lazy loading is not the entity which should have been completed by lazy loading.");
                 assert.isTrue(completeCarEntity.hasOwnProperty("manufacturer"), "Missing data field 'manufacturer' on complete car entity.");
                 assert.strictEqual(completeCarEntity.get("manufacturer"), "Audi", "Wrong data loaded.");
                 assert.isFalse(completeCarEntity.isDirty(), "Just fetched fresh data. Entity should not be dirty here.");
            }),
            deferred.reject.bind(deferred)
        );

        // Restore old DI config
        Inject.reconfigure(previousInjectConf);
        return deferred;
    },
*/
    destroy: function() {
        @datatype("Person")
        class Person extends Model {
            @field() id = null;
            @field() name = "";
            @field({dtype: "Person"}) loves;
        }
        var data = {
                id: 1,
                name: "Homer",
                loves: {
                    id: 2,
                    name: "Marge",
                    // Test: if 'dtype' refers to an entity type, the value must
                    // be recognised as ID and deserialized to an entity
                    // instance with that ID. So instance.loves.loves must
                    // be an object reference to a Person entity with id 1.
                    loves: 1
                }
            },
            manager = new EntityManager(),
            instance;
        instance = manager.create(Person, data);
        instance.destroy();
    }
});
