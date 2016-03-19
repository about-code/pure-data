/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 */
import {EntityManager} from "./EntityManager";
import {IFieldConfig, Field} from "./Field";
import {Metadata} from "./Metadata";
import {ObjectMapper} from "./ObjectMapper";

/**
 *
 * @param  {string} conf
 * @param  {Function} [baseClass] the base class of a derived entity
 * @return {Function}  actual decorator
 */
 // Unfortunately TS does not yet create fully ES6-spec compliant classes which would
 // allow to get base classes with `Object.getPrototypeOf(DerivedClass)`
 // see http://www.2ality.com/2015/02/es6-classes-final.html
 // see https://github.com/Microsoft/TypeScript/issues/1601
interface DatatypeDecoratorConfig<B> {
    /**
     * The unique class name used to reference a data type if a class constructor reference is not available.
     * Note: It might look redundant to provide the class name as a string when it could also be
     * read from `function.name` or when it could be extracted dynamically from the decorated constructor
     * function (via a Regex, see [1]). However both of these options break once the code gets *mangled*
     * as part of applying a minifier like Uglify-JS since mangling shortens function and variable
     * names to minimal length, so a constructor function might become `"a"` instead of `"MyClass"` (see [2]).
     * Extracting the name at runtime by minified code hence would yield `"a"` and any test like
     * `if (myObj.constructor.name === "MyClass") {...}` would fail.
     *
     * [1] https://www.stevefenton.co.uk/2013/04/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
     * [2] http://lisperator.net/uglifyjs/mangle
     */
    name:string;
    /**
     * A reference to the base class constructor.
     */
    base?:{new (): B;};
}
export function datatype<B>(config?:DatatypeDecoratorConfig<B>|string) {
	return function(entityCtor) {
        var regexCtorName,
            targetProto = entityCtor.prototype,
            meta = Metadata.about(targetProto, new Metadata()),
            conf:any = config;

        conf = conf || {};
        if (typeof conf === "string") {
            conf = {name: conf};
        }
        if (conf.base) {
            meta.setSuperClass(conf.base);
        }
        meta.setClassName(conf.name);
        EntityManager.registerEntityTypeCtor(conf.name, entityCtor);
	};
}

export function field(fieldConfig?:IFieldConfig) {
	return function(targetProto, name) {
        var field,
            meta = Metadata.about(targetProto, new Metadata());
        addSerializability(targetProto);
        if (!fieldConfig) {
            fieldConfig = {"name": name};
        }
        fieldConfig.name = name;
        field = new Field(fieldConfig);
        meta.addField(field);
	};
}

// TODO: TEST
export function id(targetProto, name) {
    var meta = Metadata.about(targetProto, new Metadata());
    meta.setIdProperty(name);
};


function addSerializability(targetProto) {
    if (!targetProto.hasOwnProperty("toJSON")) {
        targetProto.toJSON = function():Object {
            return ObjectMapper.toPlainObject(this, { serializeDepth: 1 });
        };
    }
}
