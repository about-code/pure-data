0.1.0
============
- Migration from Dojo-declare classes to TypeScript/ES2015 classes.
- Each class with an @datatype or  decorator will have a getMetadata() property where the corresponding metadata objects can be accessed.
- @datatype doesn't require a name anymore. It can parse the name from the class constructor function. Passing a name may be slightly more performant if there are many classes. Yet, parsing happens only once per class when the datatype decorator is executed.
- New Identity module with two exports ID() and ID_PROPERTY() to resolve an ID or the name of the ID-Property of a given object or model instance.
- Performance improvements
- Code refactoring and cleanup

### Breaking changes
- **data/decorators:** Only two decorators left:
    - @datatype (formerly called @entity)
    - 

  Others have been removed since they aren't really necessary. Use  instead.
- The approach to defining a schema has changed. There won't be the need to define a `$schema` variable anymore. With the new version it will be implicitly created by use of beforementioned decorators.
- Schema-Property option 'dtype' no longer accepts AMD module ids but only constructor references or names declared via an @datatype decorator.
- Schema-Property option 'default' removed. Use TS-Property-Initialization instead.
- Schema-Property option 'scenario' renamed into 'ignore' with inverse boolean semantics.
