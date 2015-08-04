Pure-Data comes with decorators to configure schema properties. These are currently:

**Class Decorators**
(see also [Data Modeling](./tutorial-modeling-data.html))

- `@entity(value:string)` Set the `$name` property.

**Property Decorators**
(see also [Data Modeling](./tutorial-modeling-data.html))

- `@property(value: Property)` Configure a property as if configuring it within a `$schema`.
- `@default(value:any)` See schema property option `default`
- `@type(value:string)` See schema property option `type`
- `@dtype(value:FunctionConstructor|string)` See schema property option `dtype`
- `@plain(value:string)` See schema property option `plain`
- `@serialize(value:{plain:string, formatter:Function|string, parser:Function|string})`  See schema property options `plain`, `parser`, `formatter`-
- `@inverse(value:string)` See schema property option `inverse`
- `@flags(value:string)` See schema property option `flags`
- `@setValue(value:Function)` See schema property option `setValue`
- `@getValue(value:Function)` See schema property option `getValue`

Example 1 (TypeScript 1.5+):
```javascript
///< amd-dependency path="pure/data/Model" name="Model" />
declare var Model: FunctionConstructor;
import entity from "../../src/data/decorator/entity";
import serialize from "../../src/data/decorator/property/serialize";

@entity("Person")
class Person extends Model {

	@serialize({plain: "firstName", formatter: function(value) {return value.toUpperCase();}})
	firstname:string;
	@serialize({plain: "lastName"})
	lastname:string;
	constructor(data, entityManager) {
		super(data, entityManager);
	}
}
export = Person;
```

is equivalent to
```javascript
///< amd-dependency path="pure/data/Model" name="Model" />
declare var Model: FunctionConstructor;
class Person extends Model {
	$name: "Person",
	$schema: {
		firstname: {plain: "firstName", formatter: function(value) {return value.toUpperCase();}},
		lastname:  {plain: "lastName"}
	}
	constructor(data, entityManager) {
		super(data, entityManager);
	}
}
export = Person;
```

In the first two lines we tell the typescript compiler about the [Model](./Model.html) AMD module and that the module's return value is a constructor function. With this, we can use [Model](./Model.html) as a base class of our TypeScript class. Next we import the `@entity` and `@serialize` decorators which are TypeScript modules and thus can be imported using the TypeScript/ES2015 syntax. `@serialize` allows for the configuration options `plain`, `formatter` or `parser`, all being optional. If you use `@serialize(false)` then the decorated property won't be serialized.

**Attention:** When using the assignment operator on class properties you should be aware that the actual assignment takes place *after* calling any (super-)constructors. The TypeScript code
```javascript
// Person.ts
class Person extends Model {
	firstname:string = "Unknown"; // Attention: Pitfall! Will overwrite any data.firstname
	constructor(data, entityManager) {
		super(data, entityManager);
	}
}
```
produces a plain JavaScript constructor like
```javascript
// Person.js
...
function Person(data, entityManager) {
	_super.call(this, data, entityManager);
	this.firstname = "Unknown";
}
...
```
Obviously, the default value assignment overwrites any values for `firstname` which have been set as part of deserialzing `data` in the [Model](./Model.html) super-constructor of Person. There are two possible mitigation strategies:

1. use the `@default(value:any)` or `@property({default:any})` decorators to assign default values
2. call the super-constructor without arguments and instead call `init(data, entityManager)` separately after `super()`. Since the TypeScript compiler will place assignments immediately after `super()`, any class property assignments happen before we run deserialization via `init()`.

```javascript
class Person extends Model {
	firstname:string = "Unknown";
	constructor(data, entityManager) {
		super();
		super.init.call(this, data, entityManager);
	}
}
```
