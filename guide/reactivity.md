Observers can listen for changes to a model. There are different levels they can choose to listen on
(TODO: Write UnitTest for each level):

1. **Model level** Get any changes for any property of any entity type and instance
2. **Entity-Type level** Get any changes for any instance of a particular entity type
3. **Entity-Instance level** Get any changes for any property of a particular entity instance
4. **Property level** Get any changes for a particular property on any instance of a particular entity type.
5. **OwnProperty level** Get changes to a particular property of a particular entity instance.

Depending on the level observers can subscribe to different *streams*.
A stream is an [Rx Subject](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/subjects.md) (or some derived variant of it) to which listeners can `subscribe()` to, either directly or after applying various Rx operators.

On all levels changes can be read via the *[changes stream](./OwnProperty.html#changes)*. The stream is an [Rx Subject](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/subjects.md) and can be obtained via an [Observable's](./Observable.html) `changes()` method. Subscribers to the changes stream will not only be notified about changes to a property value but also about changes to an array if the property value is an array. The stream contents will be individual ES7-like `Object.observe` change records [4] (see [example1](#exChangeRecords)).

On level 5 observers can also subscribe to the *[values stream](./OwnProperty.html#values)*. This stream is an [Rx BehaviorSubject](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/subjects.md) which means, subscribers will receive a notification with the latest stream value immediately after subscription. The stream can be obtained via the `values()` function. Unlike the changes stream, subscribers won't receive a change record but subscribing functions will receive

- the current value,
- the old value
- as well as the name of the property which changed

as individual function parameters.

*<a name="exChangeRecords">Example 1</a>: Change Records*
```javascript
var changeRecord = {
    type: 'update',
    object: object,   // the changed object
    name: string,     // the name of the property which changed
    oldValue: any     // the old property value. New value: changeRecord.object[changeRecord.name]
},

var changeRecord = {
    type: 'splice',
    object: object,        // the changed array
    index: number,         // the index at which the array modification took place
    addedCount: number     // The number of added records or 0
    removed: Array         // The elements removed from an array or an empty array
}
```

#### subscribe(onNext, onError, onCompleted)
For a full documentation, visit [RxJS](https://github.com/Reactive-Extensions/RxJS)

*<a name="exPropertySubscribe">Example 2</a>: Using RxJS operators to react to certain events*
```javascript
var data = {
        id: 1,
        age: 43,
        firstname: "Alice",
        children: [3,4,5]
    },
    alice  = entityManager.create(Person, data),
    child3 = entityManager.create(Person, {age: 3, ...}),
    child5 = entityManager.create(Person, {age: 5, ...}),
    child7 = entityManager.create(Person, {age: 7, ...}),
    children = null;

// Subscring to the values stream ...
alice.property("children").values()
    .filter(function(child){
        // applying a filter prior to subscribing...
        return child.get("age") < 6;
    })
    .subscribe(function(child){
        console.log(child);
    }),

children.push(child3); // => {age: 3, ...}
children.push(child5); // => {age: 5, ...}
children.push(child7); //
```
To unleash the full power of Functional Reactive Programming (FRP) you might
be interested in reading more on FRP with RxJS for which we recommend starting
with [1], [2] and [3].

##### References
1. [The Introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)
2. [RxJS - Reactive Extensions for JavaScript](https://www.github.com/reactive-extensions/rxjs)
3. [Introduction to Rx](http://www.introtorx.com)
4. [Object.observe (Current Proposal)](https://arv.github.io/ecmascript-object-observe/)
