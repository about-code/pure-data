*<a name="exIntro">Example 1</a>: Persons and Things*
```javascript
// foo/Thing.js
import {Model} from "pure/data/Model";

@datatype()
class Thing extends Model {
    id = null;
    name = "";

    @field({plain: "ownerId", type: "object", dtype: "Person", flags: "FK"})
    owner = null;
}

// foo/Person.js
@datatype()
class Person extends Model {

    id = null;
    firstname = "";

    @field(plain: "surname"})
    lastname = "";

    @field(plain: "partnerId", type: "number", dtype: Person, flags: "FK"})
    marriedWith = null;

    @field({type: "array",  dtype: Person})
    children = [];

    @field(type: "array", dtype: Thing, flags: "FK"})
    owns = [];
}

```
From [example1](#exIntro) we can see, that Persons can own a couple of things. Now lets say the server has already provided a list of identifiers for things owned by Alice:

*<a name="exModelLoad">Example 2</a>: Partially loaded data*
```javascript
var data = {
    id: 1,
    firstname: "Alice",
    owns: [3,4,5]
};
var alice = entityManager.create(Person, data);
```
The deserializer knows from the schema of Person that items in `owns`are of type *Thing*. When we create a new Person instance from `data`, the deserializer will also iterate over `owns` and instantiate a Thing entity for each item in there. These instances are yet just partially initialized entities. Only the `id` property is directly available until the missing data has been loaded. Nevertheless, for
all properties the respective property objects exist. So even though some plain properties are yet absent e.g. on `alice.owns[0]`, you can already subscribe to them e.g. by writing `alice.owns[0].property("name").subscribe(...)`. This way the subscriber gets notified as soon as Thing `alice.owns[0]` gets fetched. Just make sure that your subscriber tests for `undefined` because this will be the first value it receives for unavailable property data (for more on this, see [Reactivity](./tutorial-reactivity.html) tutorial).

Now that we got the identifiers in `owns` and since we know that they've been instantiated into entities we can manually iterate over them to fetch the missing data ([Example 3](#exForEachFetch)).

*<a name="exForEachFetch">Example 3</a>: Fetching things owned by Alice*
```javascript
alice.get("owns").forEach(function(thing) {
    thing.fetch().then(function(thing) {
        console.log(thing.get("name"));
    });
});
```
However, before we can make this code fly we need to specify where to get things from. We need to adapt a data store.

#### Adapting a Store
*Pure-Data* does not come with its own store implementation but encourages you to implement an adapter for your favourite store ([Example 4](#exAdaptingDstore)). After that you can [inject](./inject.html) your adapter into the [EntityManager](./EntityManager.html) via dependency-id `data/storeAdapter` thus upgrading the entity manager to fetch data from your data source ([Example 5](#exInjectAdaptingDstore)).

> Stores provide a unified API to access different storage backends. There can be REST stores which query REST APIs for data, LocalStorage stores which read and write data using a database in a web browser, or stores which implement a JSON protocol to query document-oriented DBs like CouchBase or MongoDB.


*<a name="exAdaptingDstore">Example 4</a>: Adapting [dstore](http://dstorejs.io/)*
```javascript
// foo/DstoreRestAdapter.js
define(["dstore/JsonRest"], function(JsonRest) {

    var StoreAdapterCtor;
    StoreAdapterCtor = function() {};
    StoreAdapterCtor.prototype.fetch = function(EntityTypeCtor, id) {
        var entityTypeName = EntityTypeCtor.prototype.$name;
        var store = new JsonRest({
            target: "/" + entityTypeName + '/'
         /* Model: EntityTypeCtor   Don't do that.*/
        });
        return store.get(id); // return a promise
    }
    ...
    return StoreAdapterCtor;
});
```
**Note:** *dstore* stores have a `Model` option which takes a constructor to instantiate models from plain objects. This option is not compatible with the way how *Pure-Data* Models need to be constructed. [Models](./Model.html) and their [Entity](./Entity.html) superclass expect their hosting entity manager to be passed to the constructor, which dstore don't know about. The way to go is therefore to let dstore just load the plain entity data while the [EntityManager](./EntityManager.html) takes the result of your adapter and cares for its deserialization into entity instances.

*<a name="exInjectAdaptingDstore">Example 5</a>: Configure injecting the store adapter (see also module [inject](./inject.html))*
```javascript
// foo/injectConf.js
define(["util/inject", "foo/DstoreRestAdapter"], function(inject, DstoreAdapter) {
    inject.configure({
        "data/storeAdapter": {
            Ctor: DstoreAdapter,
            singleton: true
        }
    });
});
```

#### Writing Navigation Properties (TBD)

In [Example 2](#exModelLoad) we got identifiers for things owned by Alice. Assume our server doesn't provide this information and we just get data like in [Example 6](#exLazyLoadFromStore). Nevertheless we want to be able to ask a person instance such as *Alice* for the nice things she owns. We need a navigation property. A navigation property is actually not a property but a function which implements the query to get all things whose `ownerId` property equals the person ID of *Alice* ([Example 7](#exNavigationProperty)).

*<a name="exLazyLoadFromStore">Example 6</a>: Data without references to related entities*
```javascript
var data = {
   id: 1,
   firstname: "Alice",
};
```

*<a name="exNavigationProperty">Example 7</a>: Writing a navigation property (TODO)*
```javascript
// foo/Person.js
@datatype()
class Person extends Model {

    id = null;
    firstname = "";

    @field({plain: "surname"})
    lastname = "";

    @field({type: "array",  dtype: Person})
    children = [];

    @field({plain: "partnerId", type: "number", dtype: Person, flags: "FK"})
    marriedWith = null;

    owns() {
        var store = inject('data/storeAdapter'),
            query = new RqlQuery();
        // TODO:
    }
}
```
**Note:** There are data frameworks like [BreezeJS](http://getbreezenow.com) or [ExtJS](http://www.sencha.com/extjs) who generate navigation properties from association metadata. There is no such thing in *Pure-Data* yet. Meanwhile, manually writing a navigation property is not hard, mostly the most flexible way and usually nothing more than querying a store and instantiating the entities from the query results.

*<a name="exUsingNavigationProperty">Example 8</a>: Using the navigation property (TODO)*
```javascript
var alice = entityManager.get(Person, data);
alice.owns().then(function(resultset) {
   ...
});
```

#### Nested Data and Recursive Structures

The deserialization algorithm implemented in [Model](./Model.html) employs entity management. Together with the `dtype` property config which denotes an entity type, we can properly deserialize nested and even recursive data structures. The following data can be properly deserialized based on the Person schema defined in [example1](#exIntro):

*<a name="recursiveData">Example 8</a>: Recursive data structure*
```javascript
var alice,
    aliceData = {
        id: 1,
        firstname: "Alice",
        marriedWith: {
            id: 2,
            firstname: "Bob",
            marriedWith: {
                id: 1,
                firstname: "Alice"
            }
        }
    };
alice = entityManager.get(Person, aliceData);
```
Because of the `dtype` config for property `marriedWith` in our Person's schema ([example 1](#exIntro)) the deserializer interprets values for `marriedWith` in `data` to refer to be Person data. It will attempt to create a Person instance for each object referenced via `marriedWith` using the entity manager instead of the `new` operator. Now, because Person *Alice* on the first level and Person *Alice* on the third level have both the same identity, the deserializer will create only two Person instances from `data`, one for Bob and one for Alice such that the following statement holds true:
```javascript
console.log(alice === alice.marriedWith.marriedWith); // result: true
```
