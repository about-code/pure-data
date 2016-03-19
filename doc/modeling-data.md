Pure-Data provides data modeling capabilities to create rich client-side models. A model is considered a set of entities which are related according to the modelled business domain. The class [Entity](./Entity.html) acts as the base class for *entity types*. An entity type describes a set of identifiable *entity instances*. However, to build your data model of entities you will most likely want to create your own base class for entities and make it inherit from [Model](./Model). *Model* implements some generic aspects relevant to entities in the context of a data model, for instance it sets up associations and bindings to synchronize related entities.

> If not stated otherwise, when using the term *entity* or *entity type*, we refer to data model entities derived directly or transitively from `Model`.


### @datatype

An entity type declaration begins with an `@datatype(?:DatatypeDecoratorConfig|string)` class decorator. The decorator optionally takes a string or an object literal which defines type metadata such as the type name.

|  Field  |   Type   |     Values     | Default | Purpose
|:----------:|:--------:|----------------|---------|-----------
| name       | string   |                |undefined| The type name
| base       | Function |                |undefined| A constructor reference to a base class
| idProperty | string   |                |"id"     | The name of the property which identifies a datatype instance

If no name was given the decorator tries to parse the type name from the decorated class constructor using a regular expression.

> The type name is used to refer to an entity type in situations where an imported type constructor creates a circular dependency. While circular dependencies can be handled by ES6 module loaders, the imported constructor reference may resolve to `undefined` when transpiling to ES5 and a module
format such as AMD.

### @field

Fields of entities can be configured with an object literal passed to a `@field(IFieldConfig)` decorator. The field metadata given, affects, e.g. how a field will be mapped from and to a *data object* for JSON (de-)serialization but also allows to establish bindings or *Associations* to keep related entities in sync. [Example 1](#exIntro) highlights some concepts of an entity definition and will be revisited in the coming sections


*<a name="exIntro">Example 1</a>: Person.js*
```typescript
import {datatype, field} from "data/decorators";
import {Model} from "data/Model";
import {Group} from "foo/Group";
import {Thing} from "foo/Thing";

@datatype("Person")
class Person extends Model {

    @field({ignore: 'POST'})
    id = null;

    @field()
    firstname = "";

    @field({plain: "surname"})
    lastname = "";

    @field({type: "array", dtype: "Person"})
    children = [];

    @field({plain: "partnerId", type: "number", dtype: "Person", flags: "FK"})
    loves = null;

    @field({plain: "groupId", type: "number", dtype: Group, flags: "FK"})
    memberOf = null;

    @field({type: "array", dtype: Thing, flags: "FK"})
    owns = [];
    ...
})
```

The following field configuration options are available:

|  Use Case  |  Property  |   Type   | Allowed Values | Default | Purpose
|:----------:|:----------:|:--------:|----------------|---------|-----------
|Associations| `type`     | string   | string, number, object, array, any | any | JSON-Schema compatible type used to validate a field value. A combination of `type="array"` and `dtype="T"` will cause an array set to be created.
|Associations| `dtype`    | function, string | function, entity-name | null | A constructor reference or unique entity name.
|Associations| `inverse` | string || null | Name of the inverse field on the entity type denoted by `dtype`. Creates a directed update link from source field to inverse field. Should be used together with `type`. A value of `type="array"` will cause a many-to-... link to be created. Example: Assume, on the type level we define a field `F: { type="array", dtype="X", inverse="q"}` for entities of type *E*. *q* is the name of a field of type *X*. On the instance level, adding some entity *x* to *f* of *e* causes the inverse field *q* of *x* to be updated such that it points to *e*. If *q* was an array (set), then the update would insert *e* into *q* (if not yet there).
|Serialization| `ignore`   | boolean, string   | true, false, GET,POST,PUT,DELETE |false| Indicates wether a field should be serialized and deserialized. Fields can be ignored for all or for particular REST (CRUD) scenarios, only.
|Serialization| `formatter`| function |                | null | Function or name of an entity method with signature `f(propName)`, used to format the field's value when the entity is about to be serialized. A return value of `undefined` will exclude the field from serialization.
|Serialization| `parser` | function |                | null | Function or name of a entity method, used to parse a value when its owning entity is instantiated from a plain object (deserialization).
|Serialization| `plain`   | string   |                | null | The name of the field in the entity's plain object representation. Only required if the names differ. An empty string will prevent a field from being serialized in any scenario.
|Computed Fields| `dependsOn`| string[] || null | Names of the fields a computed field is created from.
|Computed Fields| `getValue`| function |                | null | A getter to compute a dynamic value.
|Computed Fields| `setValue`| function |                | null | A setter to set a computed field. Expected to return the new computed value to be set, rather than setting it directly.
|Misc.| `flags`    | string   | FK | "" | A string with comma-separated flags, each flag enabling particular treatment.


### Entity Management

Entity management is based on the idea of an entity's *identity*. For the rest of the guide we define the identity function as follows:

> Two entities are identical if their entity type and id are identical. An entity's identity is a pair (entity type, id).

In [example 2a](#exNew) we instantiate one and the same logical entity (Person, 1) two times, using JavaScript's `new` operator and yield two different physical identities (references). Comparing both objects with the identity operator `===` reveals that their identity is not reflected on the object level.

*<a name="exNew">Example 2a</a>: Logical vs. physical identity when using `new` for entity instantiation*
```javascript
var aliceData = {
    id: 1,
    firstname: "Alice"
};
var alice1 = new Person(aliceData);
var alice2 = new Person(aliceData);
console.log(alice1 === alice2);     // prints false
...
```

An [EntityManager](./EntityManager.html) takes the role of a *factory*. It represents a context or scope in which an entity instance is guaranteed to exist only once. The method to get or create an entity is `create(Ctor, data)`. It looks up the manager's cache for some entity with the same constructor and `data.id`. If it finds one, it sets the given `data` on the existing instance and returns it, otherwise it creates a new instance and initializes it with `data`.

*<a name="exEntityManagerCreate">Example 2b</a>: Using `EntityManager` for entity instantiation*
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
[Example 2b](#exEntityManagerCreate) shows the result of applying the identity operator `===` on entities created using the entity manager. Since `alice4` gets a reference to the same object than `alice3` the identity operator naturally resolves to true. Without `aliceData` specifying an id however, the comparison would have delivered just the same result as in [example 2a](#exNew).

### Associations/Relationships
An association is a unidirectional edge from a *source entity* to a related *target entity*. On an the instance level an *OwnAssociation* establishes a binding between a *source field* of the source entity and its *inverse field* on the target. If the value of the source field changes the inverse field is updated accordingly.

There are three `@field()` configuration options required to make a field a source field of an association: `type`, `dtype` and `inverse`. `type` determines the *cardinality* of the association: `"object"` corresponds to **One** while `"array"` corresponds to **Many**. `dtype` refers to the target entity type. It's either a constructor reference or the `@datatype()` name of the target type. `inverse` specifies the name of the inverse field on the target type.

Associations have a unique ID which is generated using the template `A:pA:B:pB` where A and B are unique entity names, where pA is the name of the source field of A, and pB is the target field of B. [Example 3a](#exOneToOne) sets up a bidirectional One-to-One relationship which involves two associations  `Group:hasMember:Person:memberOf` and `Person:memberOf:Group:hasMember`.

*<a name="exOneToOne">Example 3a</a>: modeling a bidirectional One-to-One relationship*
```typescript
// foo/Group.js
@entity("Group")
class Group extends Model {
    id = "";
    @field({type: "object", dtype: "Person", inverse: "memberOf"})
    hasMember = null;
}
// foo/Person.js
@entity("Person")
class Person extends Model {
    id = "";
    @field({type: "object", dtype: "Group", inverse: "hasMember"})
    memberOf = null;
}
```

*<a name="exOneToMany">Example 3b</a>: modeling a bidirectional One-to-Many relationship: "One group may have n members"*
```typescript
// foo/Group.js
@entity("Group")
class Group extends Model {
    id = null;
    @field({type: "array", dtype: "Person", inverse: "memberOf", flags: "FK"})
    hasMember = [];
}
// foo/Person.js
@entity("Person")
class Person extends Model {
    id = null;
    @field({type: "object", dtype: "Group", inverse: "hasMember"})
    memberOf = null;
}
```
You may noticed that in [example 3b](#exOneToMany) we used the `FK` flag. It is a shortcut for a `formatter` which maps entity instances to their IDs. For instance if we serialize a Group, its `hasMember` field will be serialized to an Array of Person IDs. **Set the flag or use your custom formatter if you face infinite loops while serializing bidirectional associations**. If a `formatter` is configured, the flag will be ignored.

*<a name="exManyToMany">Example 3c</a>: modeling a bidirectional Many-to-Many relationship: One group may have n members. One member may be part of m groups.*
```typescript

// foo/Group.js
@entity("Group")
class Group extends Model {
    id = null;
    @field({type: "array", dtype: "Person", inverse: "memberOf", flags: "FK"})
    hasMembers = [];
}
// foo/Person.js
@entity("Person")
class Person extends Model {
    id = null;
    @field({type: "array", dtype: "Group", inverse: "hasMembers"})
    memberOf = [];
}
```

### Subclassing Entities
Entity inheritance has not yet been fully tested. To try it out you may start with passing a base class constructor as an argument to the `@datatype`
decorator. In TypeScript you may use `_super` for this.


<a name="exEntityInheritance">Example</a>:
```typescript
@datatype({name: "Base"})
class Base extends Model {
   ...
}

@datatype({name: "Derived", base: Base})
class Derived extends Base {
   ...
}
```

Copyright (c) 2015 devpunk
