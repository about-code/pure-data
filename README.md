Pure-Data is a data modeling library for JavaScript.

#### Project Status: Experimental!
This (spare-time) project is in quite early stage. Don't hesitate to have a look
at its documented features but be aware that it is not stable enough to be used
for serious things. As alternatives you might want to have a look at
[dmodel](http://github.com/sitepen/dmodel) or [BreezeJS](http://getbreezenow.com)

#### Key features:
- Decorators to describe a schema via annotations
- Modeling entities and entity associations (One/Many-to-One/Many)
- Change propagation among related entities via associations
- Entity management
- Deserializing and merging of plain JSON into the client-side object graph
- Reactivity and observable streams with RxJS
- Adaptable to different data store implementations
- Extensive unit test suite with thouroughly designed test cases
- Dependency Injection (DI)

#### Limitations:
- Validations not (yet) supported.
- No generic query interface planned (e.g. something like EntityQueries in [BreezeJS](http://getbreezenow.com))
- No data store planned (e.g. something like [dstore](http://github.com/sitepen/dstore)). There's an adapter interface to integrate with stores (see guide)

#### Requirements:
- ES5+ (Object.defineProperty, Array-Extras)
- ES6-Shims (Promise, Object.assign)

#### Dependencies:
- RxJS
- Dojo

#### Getting Started:
- Have a look at the [Guide](https://www.github.com/about-code/pure-data/doc/contents.md)
