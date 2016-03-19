export function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}

/**
 * The @shared decorator allows to initialize properties on the class constructor
 * prototype. Changes to shared properties will immediately be visible in all
 * instances of a class or instances of a subclass in the same class hierarchy,
 * unless there's a subclass which overwrites the shared property with an
 * OwnProperty (see Object.hasOwnProperty()).
 *
 * #### How are @shared properties different from TypeScript's static properties?
 *
 * `static` properties aren't *owned* by a particular class instance but exist on
 * a class constructor. That is, you need a constructor reference to access them,
 * e.g `MyClass.myStaticProperty`.
 *
 * Similar to static properties, shared properties aren't *owned* by a particular
 * class instance, either. They exist on the class constructor *prototype*. As a
 * consequence, shared properties can be inherited and read *as if* they exist on a
 * class instance, even though, they only exist on the prototype chain of a class
 * instance. So if we try to access them from a class instance, then the JS
 * interpreter eventually finds the shared properties via a lookup along the
 * prototype chain.
 *
 * #### Pitfalls
 * A potential source of errors is to accidentally to use the wrong syntax for
 * changing a shared value. Example:
 * ```typescript
 * // arrange
 * class MyClass {
 *     @shared("foo") sharedProp;
 * }
 * var myInstance, fromProto, fromInstance;
 * myInstance   = new MyClass();
 * // act
 * fromProto = myInstance.sharedProp;
 * myInstance.sharedProp = "bar";
 * fromInstance = myInstance.sharedProp;
 * ```
 * In the first line below `// act`  the shared value is read from the prototype.
 * The next line looks as if we changed the shared value but in fact the assignment
 * creates a JavaScript *OwnProperty* on `myInstance` which will hide the shared
 * value rather than modify it. Next time we read `myInstance.mySharedProperty`
 * the result won't be read from the prototype property anymore but from the
 * instance property. In order to modify the shared value we have to write
 * `myInstance.constructor.prototype.mySharedProperty = "foo"`.
 *
 * Another way to accidentally shadow the shared value with an own property is
 * to use default initialization for @shared decorated properties:
 * ```typescript
 * class MyClass {
 *     @shared("foo") sharedProp = "bar";
 * }
 * ```
 * TypeScript will compile the assignment `sharedProp = "bar"` to something
 * equivalent to
 * ```typescript
 * class MyClass {
 *     constructor() {
 *         this.sharedProp = "bar";
 *     }
 * }
 * ```
 * which creates a shared and an owned property at the same time. Once constructed
 * an instance will see the value `"bar"` which shadows the shared prototype property
 * with the value `"foo"`.
 *
 * Due to these pitfalls @shared() properties should best be used read-only.
 * If you don't need property inheritance and the constructor import necessary
 * to access a `static` member isn't likely to cause circular dependencies,
 * then you should consider using `static` over `@shared` properties.
 *
 * @see https://typescript.codeplex.com/discussions/444777
 *
 * @param  {any} value decorator configuration value.
 * @return {function} property decorator function
 */
function sharedDecorator(value:any) {
    return function(target, prop, descriptor?) {
        target[prop] = value;
    };
}
export {sharedDecorator as shared}
