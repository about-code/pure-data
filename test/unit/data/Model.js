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
    "dojo/promise/all",
    "dojo/Deferred",
    "dojo/Stateful",
    "pure/data/EntityManager",
    "pure/data/Model",
    "pure/data/Association",
    "pure/data/Entity",
    "pure/util/inject",
    "pure/util/type",
], function(registerSuite, assert, declare, lang, promiseAll, Deferred, Stateful, EntityManager, Model, Association, Entity, inject, type) {
    //"use strict";

    var Person = declare([Model], {
        $name: "Person",
        $schema: {
            id: null,
            familyname: null,
            firstname: null,
            fullname: {
                setValue: function(value) {},
                getValue: function() {}
            },
            age: null,
            address: {
                default: { city: null }
            },
            parents: [],
            children: [],
            loves: [],
            birthdate: {
                setValue: function() {},
                getValue: function() {}
            },
        }
    });

    registerSuite({
        name: "data/Model",
        // before each test executes
        beforeEach: function () {
        },

        instantiation__entities: function() {
            var People = declare([Model], {
                    $name: "People",
                    $schema: {id: null}
                }),
                Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        name: "",
                        loves: {dtype: "_self"}
                    }
                }),
                Male = declare([Person], {
                    $name: "Male",
                    $schema: {
                        id: null
                    }
                }),
                manager = new EntityManager(),
                instance1 = null,
                instance2 = null,
                instance3 = null,
                instance4 = null;

            instance1 = manager.create(Person, {id: 3, name: "Somebody"});
            instance2 = manager.create(Person, {id: 3, name: "Somebody Identical"});
            instance3 = manager.create(People, {id: 3, name: "Somebody"});
            instance4 = manager.create(Male,   {id: 3, name: "Somebody"});
            assert.isTrue(instance1 === instance2);
            assert.isTrue(instance2 !== instance3);
            assert.isTrue(instance2 !== instance4);
            assert.isTrue(instance3 !== instance4);
        },

        /**
         * Tests for
         * - correct instrumentation of model instance with schema property
         * - correct assignment of a schema property's default value (simple assignm.)
         * - correct evaluation of a schema property's default declaration (complex assignm.)
         *   - correct call of initializer function
         *   - respecting schema properties being 'undefined' if no default value given
         *   - correct default object initialization
         * - correct evaluation of a property object's "stateful" flag
         *   - correct instantiation of plain arrays as dojox/mvc/Stateful
         *   - correct instantiation of plain Objects as dojo/Stateful
         */
        parse_schema__default_value: function () {

            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: "Simpson", // TC: default literal; simple def.
                        firstname: {
                            /* TC default; complex def.*/
                            default: "Homer"
                        },
                        age: {
                            // TC default; complex def.; initializer function;
                            default: function() { return 40; },
                        },
                        address: {
                            // TC default object; complex def.;
                            default: { city: null }
                        },
                        parents: {}, // TC default undefined; complex def.;
                        children: {
                            // TC array initialization
                            default: []
                        }
                    }
                }),
                manager = new EntityManager(),
                instance = manager.create(Person),
                p = "";

            // check own properties (except for 'parents' which was initialized with 'undefined')
            assert.isTrue(typeof instance.parents === "undefined", "Complex property config: 'default undefined' failed");

            // check if all properties where default !== undefined have been appended to instance
            for (p in Person.prototype.$schema) {
                if (p !== "parents" && Person.prototype.$schema.hasOwnProperty(p)) {
                    assert.isTrue(instance.hasOwnProperty(p), "Own Property '" + p + "' missing on instance");
                }
            }

            // check if properties on instance have been initialized with default values
            assert.strictEqual(instance.get("familyname"),   "Simpson",      "Simple property config: 'default value' failed");
            assert.strictEqual(instance.get("firstname"),    "Homer",        "Complex property config: 'default value' failed");
            assert.strictEqual(instance.get("age"),          40,             "Complex property config: 'default initializer' failed");
            assert.strictEqual(instance.get("address").city, null,           "Complex property config: 'default object' failed");
            assert.strictEqual(instance.get("children").length, 0,           "Simple property config: 'default null' failed");
        },

        parse_schema__dtype_Statefuls: function() {

            var Person = declare([Model], {
                $name: "Person",
                $schema: {
                    p1: {default: new Stateful({}), type: "object", dtype: Stateful},
                }
            }),
            manager = new EntityManager(),
            instance = manager.create(Person);

            // check to-Stateful-conversion (flag 'stateful').
            assert.isTrue(
                instance.p1.isInstanceOf &&
                typeof instance.p1.isInstanceOf === "function" &&
                instance.p1.isInstanceOf(Stateful),
                "Property 'p1' has not been instantiated as dojo/Stateful"
            );
        },

        associations__parse_11: function() {
            var manager = new EntityManager(),
                User = declare([Model], {$name: "User"}),
                Group = declare([Model], {$name: "Group"}),
                user, user_assoc,
                group, group_assoc;

            User.prototype.$schema = {
                id: null,
                group: {default: null, type: "object", dtype: Group, inverse: "user" }
            };
            Group.prototype.$schema = {
                id: null,
                user: {default: null, type: "object", dtype: User, inverse: "group"}
            };
            user = manager.create(User, {id: "u1", group: {id: "g1", user: "u1"}});

            assert.strictEqual(user.associations().length, 1, "Incorrect number of associations created for 'User'");
            assert.strictEqual(user.get("group").associations().length, 1, "Incorrect number of associations created for 'Group'");
            user_assoc = user.associations()[0];
            group_assoc = user.get("group").associations()[0];

            assert.instanceOf(user_assoc, Association, "Item [0] in user._associations not an instance of 'Association'");
            assert.instanceOf(group_assoc, Association, "Item [0] in group._associations not an instance of 'Association'");
            assert.strictEqual(user_assoc.kind, user_assoc.I_I);
            assert.strictEqual(group_assoc.kind, group_assoc.I_I);
            assert.strictEqual("User:group:Group:user", user_assoc.id);
            assert.strictEqual("Group:user:User:group", group_assoc.id);
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
            var Super   = declare([Model], { $name: "Superclass" }),
                Sub     = declare([Super], { $name: "Subclass" }),
                Related = declare([Model], {
                    $name: "Group",
                    $schema: {
                        super: {default: null, type: "object", dtype: Super},
                        sub: {default: null, type: "object", dtype: Sub}
                    }
                }),
                manager = new EntityManager();

            Super.prototype.$schema = {
                id: null,
                pSuper: {default: null, type: "object", dtype: Related, inverse: "super" }
            };
            Sub.prototype.$schema = {
                id: null,
                pSub: {default: null, type: "object", dtype: Related, inverse: "sub"}
            };
            var superInstance = manager.create(Super, {id: "1"}),
                subInstance = manager.create(Sub, {id: "1"}),
                superAssocs = superInstance.associations(),
                subAssocs = subInstance.associations();

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
            var Owner = declare([Model], {$name: "Owner"}),
                Owned = declare([Model], {$name: "Owned"}),
                maggie, puppet,
                manager = new EntityManager();

            Owner.prototype.$schema = {
                id: "",
                owns: {default: [], type: "array", dtype: Owned, inverse: "ownedBy"}
            };
            Owned.prototype.$schema = {
                id: "",
                ownedBy: {default: null, type: "object", dtype: Owner, inverse: "owns"}
            };

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
         * ownedBy property (inverse direction);
         *
         * Note that in contrast to "propagate_resource_delete", the resource
         * may remains existent in this scenario.
         */
        associations__propagate_reference_delete_1n: function () {
            var Owner = declare([Model], {$name: "Owner"}),
                Owned = declare([Model], {$name: "Owned"}),
                maggie, puppet,
                manager = new EntityManager();

            Owner.prototype.$schema = {
                id: "",
                owns: {default: [], type: "array", dtype: Owned, inverse: "ownedBy"}
            };
            Owned.prototype.$schema = {
                id: "",
                ownedBy: {default: null, type: "object", dtype: Owner, inverse: "owns"}
            };

            maggie = manager.create(Owner, {id: 1, owns: [2]});
            puppet = manager.create(Owned, {id: 2, ownedBy: 1});

            assert.strictEqual(maggie.owns[0], puppet, "Expected maggie to own puppet the puppet.");
            assert.strictEqual(puppet.ownedBy, maggie, "Expected puppet to be owned by maggie.");

            // remove ownership between maggie and puppet. Expect changes on
            // maggie to be reflected inversely in puppet.
            maggie.owns.splice(0, 1);

            assert.strictEqual(true, true);
            assert.strictEqual(puppet.ownedBy, null, "Puppet still owned by maggie although maggie does not own puppet anymore.");
        },

        /**
         * Tests for
         * - properties being initializable via constructor
         * - non-schema properties being definable via constructor (these won't be serialized, though)
         * - default values being ignored when there's a default value provided with the constructor.
         */
        instantiation__apply_props: function () {
            var manager = new EntityManager(),
                Person = declare([Model], {
                $name: "Person",
                $schema: {
                    familyname: "Simpson",
                    firstname: null,
                    age: {default: 0},
                    address: {
                        default: { city: null }
                    },
                    parents: [],
                    children: []
                }
            });
            var instance = manager.create(Person, {firstname: "Homer", age: 40, hobbies: "watching TV"});

            assert.strictEqual(instance.get("firstname"), "Homer", "Schema-declared property was not initialized with value provided with the constructor");
            assert.strictEqual(instance.get("hobbies"), "watching TV", "Properties provided via constructor are not mixed in");
            assert.strictEqual(instance.get("age"), 40, "Constructor default values (higher priority) are overwritten by schema default values (lower priority)");
        },

        // TODO: Statefuls no longer supported. Adjust test case...
        instantiation__performance_create_100: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: "Simpson",
                        firstname: { default: "Homer", scenario: "*" }, // TC: always serialized
                        age: { default: 40, scenario: "GET,POST"}, // TC: not serialized for PUT
                        address: {
                            default: { city: null}, // TC: associated (plain) objects get serialized...
                            scenario: 'GET,POST,PUT', // TC: ...for all reasonable verbs
                            flags: 'stateful'       // TC: ...without dojo/Stateful properties
                        },
                        parents: {default: ["Abe"], scenario: 'none'}, // TC: unknown scenario => not serialized
                        children: {
                            default: ["Bart", "Lisa", "Maggie"],
                            flags: 'stateful'       // TC: serialized to plain array
                        }
                    }
                }),
                manager = new EntityManager(),
                i = 0;
            for (i = 0; i < 100; i += 1) {
                manager.create(Person);
            }
        },


        instantiation__performance_create_1000: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: "Simpson",
                        firstname: { default: "Homer", scenario: "*" }, // TC: always serialized
                        age: { default: 40, scenario: "GET,POST"}, // TC: not serialized for PUT
                        address: {
                            default: { city: null}, // TC: associated (plain) objects get serialized...
                            scenario: 'GET,POST,PUT', // TC: ...for all reasonable verbs
                            flags: 'stateful'       // TC: ...without dojo/Stateful properties
                        },
                        parents: {default: ["Abe"], type: 'array', dtype: '_self', scenario: 'none'}, // TC: unknown scenario => not serialized
                        children: {
                            default: ["Bart", "Lisa", "Maggie"],
                            type: 'array',
                            dtype: '_self'
                        }
                    }
                }),
                i = 0,
                manager = new EntityManager();
            for (i = 0; i < 1000; i += 1) {
                manager.create(Person, {id: i, age: i, address: "My street X", parents: [1,2,3]});
            }
        },

        instantiation__performance_Model_new_100_identities_10: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: "Simpson",
                        firstname: { default: "Homer", scenario: "*" }, // TC: always serialized
                        age: { default: 40, scenario: "GET,POST"}, // TC: not serialized for PUT
                        address: {
                            default: { city: null}, // TC: associated (plain) objects get serialized...
                            scenario: 'GET,POST,PUT', // TC: ...for all reasonable verbs
                            flags: 'stateful'       // TC: ...without dojo/Stateful properties
                        },
                        parents: {default: ["Abe"], scenario: 'none'}, // TC: unknown scenario => not serialized
                        children: {
                            default: ["Bart", "Lisa", "Maggie"],
                            flags: 'stateful'       // TC: serialized to plain array
                        }
                    }
                }),
                i = 0,
                manager = new EntityManager();
            for (i = 0; i < 100; i += 1) {
                manager.create(Person, {id: i%10, age: i});
            }
        },


        /**
         * Tests for
         * - correct rendering of plain JS object from a Model instance...
         */
        serialization__scenario: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: "Simpson",
                        firstname: { default: "Homer", scenario: "*" }, // TC: always serialized
                        age: { default: 40, scenario: "GET,POST"}, // TC: not serialized for PUT
                        address: {
                            default: { city: null}, // TC: associated (plain) objects get serialized...
                            scenario: 'GET,POST,PUT', // TC: ...for all reasonable verbs
                            flags: 'stateful'       // TC: ...without dojo/Stateful properties
                        },
                        parents: {default: ["Abe"], scenario: 'none'}, // TC: unknown scenario => not serialized
                        children: {
                            default: ["Bart", "Lisa", "Maggie"],
                            type: 'array',
                            dtype: '_self',
                            scenario: '*'
                        }
                    }
                });
            var manager = new EntityManager();
            var instance = manager.create(Person);
            var data = null;

            // test scenario
            data = instance.toPlainValue({scenario: "PUT"});
            assert.strictEqual(data.familyname, "Simpson");
            assert.strictEqual(data.firstname, "Homer");
            assert.isTrue(typeof data.age === "undefined", "property configured to be serialized only for scenario 'GET,POST' but was serialized for 'PUT'");
            assert.isTrue(typeof data.parents === "undefined", "property configured to be never serialized but was serialized for 'PUT'");
            assert.strictEqual(data.children.length, 3, "failed to render array 'children'");
        },

        serialization__depth_0: function() {
            var manager = new EntityManager(),
                homer = manager.create(Person, {id: 1, familyname: "Simpson", firstname: "Homer"}),
                data = homer.toPlainValue({serializeDepth: 0});
            assert.strictEqual(data, homer.id, "Serialization depth of 0 did not resolve to entity id. Entity was serialized with depth 1 or deeper");
        },

        serialization__depth_1: function() {
            var manager = new EntityManager(),
                homer = manager.create(Person, {id: 1, familyname: "Simpson", firstname: "Homer"}),
                bart  = manager.create(Person, {id: 2, familyname: "Simpson", firstname: "Bart"}),
                data = null;

            homer.get("children").push(bart);
            data = homer.toPlainValue({serializeDepth: 1});

            assert.strictEqual(data.children[0], 2, "Bart entity was not serialized to ID");
        },

        serialization__depth_2: function() {
            var manager = new EntityManager();
            var homer = manager.create(Person, {familyname: "Simpson", firstname: "Homer"});
            var bart  = manager.create(Person, {familyname: "Simpson", firstname: "Bart"});
            var data = null;

            homer.get("children").push(bart);
            data = homer.toPlainValue();

            assert.strictEqual(data.firstname, "Homer");
            assert.strictEqual(data.children[0].firstname, "Bart", "Referenced model classes not serialized");
        },

        serialization__depth_3_circular_references: function() {
            var manager, homer, data;
            manager = new EntityManager();
            homer = manager.create(Person, {id: "1", familyname: "Simpson", firstname: "Homer"});
            data = null;

            homer.get("loves").push(homer);
            data = homer.toPlainValue({serializeDepth: 3});

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
            data = homer.toPlainValue();
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
            data = homer.toPlainValue();
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

        serialization__plain: function() {
            var manager = new EntityManager(),
                Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: { default: "Simpson", plain: "surname" },
                    }
                }),
                instance = manager.create(Person),
                data = instance.toPlainValue();

            assert.isTrue(data.hasOwnProperty("surname") && data.surname === "Simpson", "'familyname' should have been mapped to 'surname'");
            assert.isTrue(data.familyname === undefined, "'familyname' still exists although it should have been mapped to 'surname'");
        },

        /**
         * Test for correct mapping from properties of plain entity data objects
         * onto the entity instance properties.
         */
        deserialization__plain: function() {
            var manager = new EntityManager();
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: { default: "", plain: "surname" },
                    }
                });
            var instance = manager.create(Person, {surname: "Simpson"});

            assert.isFalse(instance.hasOwnProperty('surname'), "Property 'surname' exists on entity instance where it should only exist as 'familyname'");
            assert.strictEqual(instance.familyname, "Simpson", "Value of plain property 'surname' has not been mapped to entity property 'familyname'");
        },

        deserialization__parser: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        p1: {
                            parser: function(value) {
                                if (value == "unparsed") {
                                    return "parsed";
                                }
                            }
                        }
                    }
                }),
                data = {
                    p1: "unparsed"
                },
                manager = new EntityManager(),
                instance = manager.create(Person, data);
            assert.strictEqual(instance.get("p1"), "parsed");
        },

        /**
         * Tests for the constructor declared via the 'dtype' property config
         * is getting the value returned from a parser declared via the 'parser'
         * property config. The parser itself got the raw value from data.
         * => entity[p] = new ctor(parser(data[p]));
         */
        deserialization__parser_before_constructor: function() {
            var actual = "",
                Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        obj: {
                            dtype: function(data) {
                                actual = data.id;
                            },
                            parser: function(value) {
                                value.id = "parsed";
                                return value;
                            }
                        }
                    }
                }),
                data = {
                    obj: {
                        id: "unparsed"
                    }
                },
                manager = new EntityManager(),
                instance = manager.create(Person, data);

            assert.strictEqual(actual, "parsed");
        },

        /**
         * Tests for deserialization of properties, whose "dtype" config refers
         * to "_self", that is, to the type described via the schema.
         * E.g. a Person class might have a property "children" who are
         * Persons themselves. Hence the children-Property's "dtype" refers to
         * "_self".
         */
        deserialization__dtype_self_recursive_constructor: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        familyname: "Simpson",
                        firstname: "Homer",
                        age: 40,
                        address: {
                            default: { city: null },
                        },
                        child: {
                            dtype: "_self" // Child is a Person, too
                        }
                    }
                }),
                data = {
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
            assert.isTrue(instance.child.isInstanceOf(Person));
            assert.strictEqual(instance.child.familyname, data.child.familyname);
            assert.strictEqual(instance.child.firstname, data.child.firstname);
            assert.strictEqual(instance.child.age, data.child.age);
            assert.strictEqual(instance.child.child, undefined);
        },

        deserialization__dtype_constructor_is_simple: function() {
            var Pet = function(props) {
                    this.id = null;
                    this.name = null;
                    this.kind = null;
                    lang.mixin(this, props);
                },
                Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        familyname: null,
                        firstname: null,
                        pet: {
                            default: null,
                            dtype: Pet
                        }
                    }
                }),
                data = {
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
            assert.isTrue(deserialized.get("pet") !== undefined, "pet property has not been defined.");
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
            var Pet = declare([Model], {
                    $name: "Pet",
                    $schema: {
                        id: null,
                        kind: null,
                        name: null
                    }
                }),
                Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        familyname: null,
                        firstname: null,
                        pet: {default: null, dtype: Pet}
                    }
                }),
                data = {
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
            assert.isTrue(deserialized.get("pet") !== undefined, "pet property has not been defined.");
            assert.instanceOf(deserialized.get("pet"), Pet, "Expected 'deserialized.pet' being instance of 'Pet'");
            assert.instanceOf(deserialized.get("pet"), Model, "Expected 'deserialized.pet' being instance of 'Model'");
            assert.strictEqual(deserialized.get("pet").get("kind"), "dog", "Expected 'deserialized.pet.kind' to be 'dog'");
            assert.strictEqual(deserialized.get("pet").get("name"), "Knecht Ruprecht");
        },

        deserialization__dtype_for_type_is_object: function() {
            /*
             type: 'object' is the default assumption for properties with a
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
            var Pet = declare([Model], {
                    $name: "Pet",
                    $schema: {
                        id: null,
                        kind: null,
                        name: null
                    }
                }),
                Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        familyname: null,
                        firstname: null,
                        pets: {default: null, type: "array", dtype: Pet}
                    }
                }),
                data1 = {
                    id: 1,
                    familyname: "Simpson",
                    firstname: "Homer",
                    pets: { // Scenario 1: schema type is "array", plain type is "object"
                        id: 1,
                        kind: "dog",
                        name: "Knecht Ruprecht"
                    }
                },
                manager = new EntityManager(),
                deserialized1;

            // In scenario 1 we should see a warning about the type mismatch on the console
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
            var manager = new EntityManager();
            var Car = declare([Model], {
                $name: "Car",
                $schema: {
                    id: "",
                    manufacturer: "",
                    model: ""
                }
            });
            var Person = declare([Model], {
                $name: "Person",
                $schema: {
                    id: "",
                    name: "",
                    drives: {default: null, dtype: Car}
                }
            });
            var personEntity = manager.create(Person, {
                id: 1,
                name: "Homer",
                drives: 2 // create a car entity with id 2 but no other properties
            });
            var carEntity = personEntity.get("drives");
            assert.isTrue(typeof carEntity.isInstanceOf === "function" && carEntity.isInstanceOf(Car), "No car instance created for property 'drives'");
            assert.isTrue(carEntity.hasOwnProperty("manufacturer"), "Did expect property 'manufacturer' to exist on 'carEntity'.");
            assert.isTrue(carEntity.hasOwnProperty("model"), "Did expect property 'model' to exist on 'carEntity'");
        },

        /**
         * Tests for an array of entity IDs being deserialized into an array of
         * entity objects. The objects are said to be "incomplete", that is,
         * there are no other properties apart from the id-property with the
         * value given in the raw data (lazy loading may complete the entities).
         */
        deserialization__entity_ids_to_entity_array: function() {
            var manager = new EntityManager();
            var Car = declare([Model], {
                $name: "Car",
                $schema: {
                    id: "",
                    manufacturer: "",
                    model: ""
                }
            });
            var Person = declare([Model], {
                $name: "Person",
                $schema: {
                    id: "",
                    name: "",
                    drives: {default: null, type: "array", dtype: Car}
                }
            });
            var personEntity = manager.create(Person, {
                id: 1,
                name: "Homer",
                drives: [2, 3] // create two car entities with id 2 but no other properties
            });
            var carEntities = personEntity.get("drives");

            assert.isTrue(type.isCollection(carEntities), "Didn't deserialize id-array to entity-array.");
            assert.strictEqual(carEntities.length, 2, "Deserialized array length didn't match raw array length.");
            assert.isTrue(typeof carEntities[0].isInstanceOf === "function" && carEntities[0].isInstanceOf(Car), "No car instance created for property 'drives[0]'");
            assert.isTrue(typeof carEntities[1].isInstanceOf === "function" && carEntities[1].isInstanceOf(Car), "No car instance created for property 'drives[1]'");
            assert.isTrue(carEntities[0].hasOwnProperty("manufacturer"), "Did expect property 'manufacturer' to exist on 'drives[0]'.");
            assert.isTrue(carEntities[1].hasOwnProperty("manufacturer"), "Did expect property 'manufacturer' to exist on 'drives[1]'.");
            assert.isTrue(carEntities[0].hasOwnProperty("model"), "Did expect property 'model' to exist on 'drives[0]'.");
            assert.isTrue(carEntities[1].hasOwnProperty("model"), "Did expect property 'model' to exist on 'drives[1]'.");

            personEntity.drives.push(4);
            assert.isTrue(typeof carEntities[2].isInstanceOf === "function" && carEntities[2].isInstanceOf(Car), "No car instance created when pushing new element to car collection.");
        },

        /**
         * Tests that circular references to the same entity resolving to the
         * same JavaScript object. The Test constructs a type Person who
         * has an attribute "loves" whose instances are also instances of
         * type Person. So if there are two persons with the same id, then,
         * only a single instance must be created.
         */
        deserialization__circular_references: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        name: "",
                        loves: {dtype: "_self"}
                    },
                    $serializeDepth: -1
                }),
                data = {
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
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        name: "",
                        loves: {dtype: "_self"}
                    }
                }),
                data = {
                    id: 1,
                    name: "Homer",
                    loves: {
                        id: 2,
                        name: "Marge",
                        // TC: if 'dtype' refers to an entity type, the value must
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
         * Test case which tests for a scenario which may end up in an infinite
         * loop if deserialization is not properly implemented.
         *
         * Sources of inifinite loop might be:
         * - use of lang.clone() which can't deal with circular references
         * - calling Entity.new(ctor, props) where props is already some
         *   Entity.
         *
         * Why infinite loops?
         *
         * First there are User and Group which each have properties who are
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
            var manager = new EntityManager(),
                User = declare([Model], {$name: 'User' }),
                Group = declare([Model], { $name: 'Group' });

            /** Circularity/Interdependency on type level */
            User.prototype.$schema = {
                id: '',
                memberOf: { type: 'object', dtype: Group }
            };                              /*---------*/
            Group.prototype.$schema = {
                id: '',
                hasMembers: { type: 'array', dtype: User }
            };                              /*---------*/

            /** Circularity on instance and instruction level */
            var g1 = manager.create(Group, {
                id: 'g1',
                hasMembers: ["u1", "u2"]
            });

            var u1 = manager.create(User,  {id: "u1", memberOf: g1 });
            var u2 = manager.create(User,  {id: "u2", memberOf: g1 });
                                                /*----------*/
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

            // change schema property
            assert.strictEqual(instance.get("firstname"), "Homer");
            instance.set("firstname", "Marge");
            assert.strictEqual(instance.get("firstname"), "Marge");
            assert.isTrue(instance.isDirty());
        },


        load__lazy: function() {
            inject.configure("data/storeAdapter", {
                factory: function() {
                    return { // Simple store adapter..
                        fetch: function(EntityTypeCtor, id) {
                            return new Promise(function(resolve, reject) {
                                resolve({id: 1, manufacturer: "Audi", model: "TT" });
                            });
                        }
                    };
                }
            });
            var manager = new EntityManager(),
                deferred,
                partialCarEntity;
            var Car = declare([Model], {
                $name: "Car",
                $schema: {
                    id: "",
                    manufacturer: "",
                    model: ""
                }
            });
            var Person = declare([Model], {
                $name: "Person",
                $schema: {
                    id: "",
                    name: "",
                    drives: {default: null, dtype: Car}
                }
            });
            var personEntity = manager.create(Person, {
                id: 1,
                name: "James",
                drives: 1 // car entity to be lazy loaded
            });

            assert.isTrue(personEntity.get("drives").hasOwnProperty("manufacturer"), "Did expect partial car entity to have all properties prior to lazy loading.");

            // Next we check if a (yet incomplete) car entity has been instantiated for the ID in personEntity.drives.
            // Lazy loading will complete this entity with data, making it immediately available to all other objects
            // referencing the same entity.
            assert.isTrue(personEntity.get("drives").isInstanceOf(Car), "Property 'drives': no entity created for entity reference.");
            assert.isTrue(personEntity.get("drives").hasOwnProperty("id"), "Expected partial car entity to have an ID.");

            deferred = this.async(2000);
            partialCarEntity = personEntity.get("drives");
            partialCarEntity.fetch().then(
                deferred.callback(function(completeCarEntity) {
                     assert.isTrue(completeCarEntity === partialCarEntity, "Result from lazy loading is not the entity which should have been completed by lazy loading.");
                     assert.isTrue(completeCarEntity.hasOwnProperty("manufacturer"), "Missing data property 'manufacturer' on complete car entity.");
                     assert.strictEqual(completeCarEntity.get("manufacturer"), "Audi", "Wrong data loaded.");
                     assert.isFalse(completeCarEntity.isDirty(), "Just fetched fresh data. Entity should not be dirty here.");
                }),
                deferred.reject.bind(deferred)
            );
            return deferred;
        },

        destroy: function() {
            var Person = declare([Model], {
                    $name: "Person",
                    $schema: {
                        id: null,
                        name: "",
                        loves: {dtype: "_self"}
                    }
                }),
                data = {
                    id: 1,
                    name: "Homer",
                    loves: {
                        id: 2,
                        name: "Marge",
                        // TC: if 'dtype' refers to an entity type, the value must
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
});
