Pure-Data provides data modeling capabilities to create rich client-side models which can be synchronized with
a server. The class [Entity](./Entity.html) acts as the base class for *entity types*.
As part of data modeling, however, you will most commonly use [Model](./Model) which inherits from [Entity](./Entity.html) and implements all the aspects of rich data model entities.

>If not stated otherwise, when using the term Entity or entity type, we technically refer to the class Model and its subclasses in the first place.

Each entity type describes a set of *entity instances*. Instead of *entity instance* we also sometimes refer to a *model instance*. A `$schema` is an object literal in which the properties are listet which are common to instances of a particular entity type. Each property can be configured in detail with another object literal. Each such object literal will get translated into an instance of [Property](./Property.html). [Example 1](#exIntro) highlights some concepts of an entity definition and will be revisited in the coming sections

> **Convention**: Metadata-Properties will be preceeded by a dollar (`$`) sign. Each entity type must have at least a `$name` property.

*<a name="exIntro">Example 1</a>: Person.js*
```javascript
define([
    'dojo_base/declare',
    'src/data/Model',
    'foo/Group',
    'foo/Thing'
], function(declare, Model, Group, Thing) {

    return declare([Model], {
        $name: "Person",
        $schema: {
            id:        {default: null, scenario: 'PUT'},
            firstname: "",
            lastname:  {default: "", plain: "surname"},
            children:  {default: [], type: "array",  dtype: "_self"},
            loves:     {default: null, plain: "partnerId", type: "number", dtype: "_self", flags: "FK"},
            memberOf:  {default: null, plain: "groupId",   type: "number", dtype: "foo/Group", flags: "FK"},
            owns:      {default: [], type: "array", dtype: Thing, flags: "FK"}
        },
        ...
    });
});
```

#### $schema

A schema is an object literal which describes properties of entities as well as how entities are related. A property configuration configures various operations on an entity and its properties, for example, how they are initialized, serialized and deserialized. Most notably they configure associations which will enable maintainance of a consistent in-memory model (object graph) from JSON data. You'll find more on associations below.

When an entity type is instantiated, the schema will be *parsed*.
Parsing roughly involves the following steps:

1. Property objects - instances of [Property](./Property.html) - are created from the schema property configurations
2. properties are copied from the schema onto the newly created entity instance
3. properties are initialized with the default value from the schema or data passed to the constructor.

Step one is processed only once per entity type with the instantiation of the first entity instance of that type. After that property objects will be accessible via the instance's `property(pname)` method.

The following property configuration options are available:

|  Property  |   Type   |     Values     | Default | Purpose
|:----------:|:--------:|----------------|---------|-----------
| `default`  | any, function || undefined | The default value to assign on entity instantiation. If none is given, the property will remain *undefined* on the instance. If `default` is a function the function is used as an *initializer*. It will be replaced by its own return value once it was executed. The return value will become the default value for all instances created from the entity type.
| `type`     | string   | string, number, object, array, any | any | JSON-Schema compatible type used to validate a property value. A combination of `type="array"` and `dtype="T"` will cause an array set to be created.
| `dtype`    | function, string | function, AMD module id, `"_self"` | null | A constructor function or AMD module id for a module which returns a constructor function. The function signature, must take at least one argument, which is a plain object used to initialize a new instance. The string `"_self"` can be used to refer to the constructor of the type which is just described by the schema in which `"_self"` is used.
| `inverse` | string || "" | Name of the inverse property on the entity type denoted by `dtype`. Creates a directed update link from source property to inverse property. Should be used together with `type`. A value of `type="array"` will cause a many-to-... link to be created. Example: Assume, on the type level we define a property `p: { type="array", dtype="F", inverse="q"}` for entity type *E*. *q* is a scalar property of *F*. On the instance level, adding some entity *f* to *p* of *e* causes the inverse property *q* of *f* to be updated such that it points to *e*. If *q* was an array (set), then the update would insert *e* into *q* (if not yet there).
| `scenario`   | string   | *,GET,POST,PUT,NONE | * | Indicates for which REST (CRUD) scenario a property will be (de)serialized.
| `formatter`| function |                | null | Function or name of an entity method, used to format the property's value when the entity is about to be serialized.
| `parser` | function |                | null | Function or name of a entity method, used to parse a value when its owning entity is instantiated from a plain object (deserialization).
| `plain`   | string   |                | null | The name of the property in the entity's plain object representation. Only required if the names differ. An empty string will prevent a property from being serialized in any scenario.
| `flags`    | string   | FK | "" | A string with comma-separated flags, each flag enabling particular treatment.
| `getValue` TODO| function |                | null | A getter to compute a dynamic value.
| `setValue` TODO| function |                | null| A setter to set a computed property

### Entity Management

*<a name="exNew">Example 2a</a>: Don't: using `new` keyword for entity instantiation*
```javascript
var aliceData = {
    id: 1,
    firstname: "Alice"
};
var alice1 = new Person(aliceData); // won't work, just an example
var alice2 = new Person(aliceData);
console.log(alice1 === alice2);     // prints false
...
```
Entity management is based on the idea of an entity's *identity*. Two entities are identical if their entity type and id are identical. So an entity's identity is a pair (entity type, id). In [example 2a](#exNew) we essentially instantiate one and the same entity (Person, 1) two times, using JavaScript's `new` operator. Yet, comparing both objects with the identity operator `===` reveals that their identity is not reflected on the object level. To fix this an [EntityManager](./EntityManager.html) takes the role of a *factory* which is to be used for entity instantiation. More abstract spoken the manager maintains a context or scope in which an entity instance is guaranteed to exist only once.

*<a name="exNew">Example 2b</a>: Do: using `EntityManager` for entity instantiation*
```javascript
// Creating a client-side entity instance
var em = new EntityManager();
var alice = em.create(Person, aliceData);
```
The method to get or create an entity is `create(Ctor, props)`. It looks up the manager's cache for some entity with the same constructor and `props.id`. If it finds one, it returns the existing instance, otherwise it returns a new one. [Example 3](#exModelNew) shows the result of applying the identity operator `===` on entities created with `create(Ctor, props)`. Since `alice4` gets a reference to the same object than `alice3` the identity operator naturally resolves to true. Without `aliceData` specifying an id however, the comparison would have delivered just the same result as in [example 2](#exNew).

> Instances of [Entity](./Entity.html) or [Model](./Model.html) will be attached to  the entity manager as soon as their id-property is set.

*<a name="#exModelNew">Example 3</a>: Entities and Identity when using entity management*
```javascript
var aliceData = {
    id: 1,
    firstname: "Alice"
};
var entityManager = new EntityManager();
var alice3 = entityManager.create(Person, aliceData);
var alice4 = entityManager.create(Person, aliceData);
console.log(alice3 === alice4);      // prints true
```

### Associations/Relationships
There are three property configuration options involved in modeling associations: `type`, `dtype` and `inverse`. The associated entity type is configured via `dtype`, which either points to a constructor function or is an AMD module id of the module which returns the constructor. `inverse` specifies the name of the inverse property on the associated entity type. The option configures how updates to a property value propagate to the related entity. To enable bidirectional updates, either entity
participating in an association must configure the related inverse.

An association identifier is constructed as `A:pA:B:pB`, based on a entity's name (A), its relationship property (pA), the related entity's name (B) and his property (pB), which is the inverse of pA. More abstract, the format is
```
$name:property:$name:invProperty
```
So, in [example 4](#exOneToOne) Group and Person are associated by an association
with ID `Group:hasMember:Person:memberOf`. This ID is construed from the declaration of the Group-Entity. Associations are directed. From the declaration of the Person-Entity the example will also produce an association in inverse direction which has id `Person:memberOf:Group:hasMember`

#### Multiplicity

The *multiplicity* of an association is derived from `type` configuration on both sides of the association. In general types other than `type: "array"` correspond to 1 while `type: "array"` corresponds to many. Examples [4](#exOneToOne) to [6](#exManyToMany) show how to model the various kinds of relationships.

*<a name="exOneToOne">Example 4</a>: modeling a bidirectional one-to-one relationship*
```javascript

// foo/Group.js
return declare([Model]), {
    $name: "Group",
    $schema: {
        id: {},
        hasMember: {type: "object", dtype: "foo/Person", inverse: "memberOf"}
    }
});
// foo/Person.js
declare([Model], {
    $name: "Person",
    $schema: {
        id: {},
        memberOf: {type: "object", dtype: "foo/Group", inverse: "hasMember"}
    }
});
```

*<a name="exOneToMany">Example 5</a>: modeling a bidirectional one-to-many relationship: "One group may have n members"*
```javascript

// foo/Group.js
declare([Model]), {
    $name: "Group",
    $schema: {
        id: {},
        hasMember: {type: "array", dtype: "foo/Person", inverse: "memberOf", flags: "FK"}
    }
});
// foo/Person.js
declare([Model], {
    $name: "Person",
    $schema: {
        id: {},
        memberOf: {type: "object", dtype: "foo/Group", inverse: "hasMember"}
    }
});
```
You may noticed that in [example 5](#exOneToMany) we used the `FK` flag. It is a shortcut for a `formatter` which maps entity instances to their IDs. For instance if we serialize a Group, its `hasMember` property will be serialized to an Array of Person IDs. **Set the flag or use your custom formatter if you face infinite loops while serializing bidirectional associations**. If a `formatter` is configured, the flag will be ignored.

*<a name="exManyToMany">Example 6</a>: modeling a bidirectional many-to-many relationship: One group may have n members. One member may be part of m groups.*
```javascript

// foo/Group.js
declare([Model]), {
    $name: "Group",
    $schema: {
        id: {},
        hasMembers: {type: "array", dtype: "foo/Person", inverse: "memberOf", flags: "FK"}
    }
});
// foo/Person.js
declare([Model], {
    $name: "Person",
    $schema: {
        id: {},
        memberOf: {type: "array", dtype: "foo/Group", inverse: "hasMembers"}
    }
});
```

### Writing Data / Saving Entities TBD


Copyright (c) 2015 devpunk
