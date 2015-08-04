Pure-Data is a data modeling library for JavaScript.

#### Project Status: Experimental!
Yet I strive for making things sound ;-) Help me by submitting issues.

#### Key features:
- Modeling entities and entity associations (One/Many-to-One/Many)
- Model consistency due to change propagation among related entities
- Entity management
- Deserialization from plain JSON into an entity object graph
- Fine-grained control over entity serialization
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
- Have a look into the [Guide](./guide)
