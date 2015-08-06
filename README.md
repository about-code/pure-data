Pure-Data is a data modeling library for JavaScript.

#### Project Status: Experimental!
This (spare-time) project is in quite early stage. Don't hesitate to have a look
at its documented features but be aware that it is not stable enough to be used
for serious things.

#### Key features:
- Modeling entities and entity associations (One/Many-to-One/Many)
- Model consistency due to change propagation among related entities
- Entity management
- Deserializing and merging of plain JSON into the client-side object graph
- Fine-grained control over serialization
- Reactivity and observable streams with RxJS
- Adaptable to different data store implementations
- Dirty state
- Decorators to describe a schema via annotations (currently TypeScript, only)
- Extensive unit test suite with thouroughly designed test cases
- Basic Dependency Injection (DI)

#### Limitations:
- Validations not (yet) supported.
- No generic query interface so far (like e.g. [BreezeJS](http://getbreezenow.com))
- No data store planned. Adapter interface to integrate stores (see guide)

#### Requirements:
- EcmaScript 5+ (Object.defineProperty, Array Extras)

#### Getting Started:
- Have a look at the [Guide](./guide/contents.md)
