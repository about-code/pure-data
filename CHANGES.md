0.1.0
============
- Migration from Dojo-declare classes to TypeScript/ES2015 classes.
- New Identity module with two exports ID() and ID_PROPERTY() to resolve an ID or the name of the ID-Property of a given object or model instance.

### Breaking changes

This version is a backward-incompatible transition to [TypeScript](https://www.typescriptlang.org) with many API changes. Most notable changes are:

- Schema properties previously represented by class `Property` are no longer called *properties*. They are now called *fields*, represented by class `Field` and configured via a `@field` decorator.
- The approach to defining a schema has changed. `$schema` isn't supported anymore. With the new version a schema will be implicitly created by use of the following TypeScript decorators:
- **data/decorators:** No only three decorators, left:
    - @datatype: Providing class metadata, most notably an entity type name for the entity manager.
    - @field: Providing field metadata and serialization information
    - @id: Annotating the id property.
- Field option 'dtype' no longer accepts AMD module ids but only constructor references or class names declared with an `@datatype({name: ...})` decorator.
- Field option 'default' is no longer necessary. Use TS-Property-Initialization instead.
- Field option 'scenario' was renamed to 'ignore' with inverse boolean semantics.
