import {SimpleMap, ArraySet} from "../collection/collection";
import {ID} from "./Identity";
import {Field} from "./Field";
import {Association} from "./Association";

/**
 * Class to hold metadata for data types and models. Clients usually won't
 * provide metadata to the `Metadata` class itself but to decorators which
 * in turn use the `Metadata`-API. Clients may use the the static `about*`
 * methods, though, to obtain metadata about an instance or a particular data
 * type.
 *
 * ### Usage:
 * Providing metadata through decorators:
 * ```
 * @datatype("Customer")
 * export class Customer {
 *
 *    @field() @id() custId = null;
 *    @field() firstName = "";
 *    @field() lastName = "";
 *
 *    constructor() {}
 * }
 * var customer = new Customer();
 * ```
 * Reading metadata for an annotated type:
 * ```
 * var meta = Metadata.about(customer);
 * console.log(meta.getClassName()) // => "Customer"
 * ```
 */
export class Metadata {
    private $isComplete: boolean = false;
    private $name: string;
    private $fields = {};
    private $idProperty: string;
    private $associations = new ArraySet({
        keyFn: ID
    });
    private $aliases = {};
    private $superclass = null;

    /**
     * Use this to read metadata stored along the prototype chain of `target`.
     * Use this if you're unsure whether to use `about()` or `aboutClassOf()`.
     *
     * @param  {object} target The object to read metadata.
     * @param  {Metadata} [newInstance] If no `_meta` property exists on `target` create one with a reference to a `newInstance` of `Metadata`.
     * @return {Metadata} `undefined` if there's no metadata for `target`.
     */
    static aboutClassOf(target:any, newInstance?:Metadata):Metadata {
        if (typeof target === "function") {
            target = target.prototype; // assume target is a constructor. Return _meta on constructor.prototype
        } else if (target && typeof target === "object") {
            target = target.constructor.prototype;
        }
        return Metadata.about(target, newInstance);
    }

    /**
     * Use this to get or initialize a `_meta` property of type `Metadata`
     * on `target`.
     * @param  {object} target The object with a `_meta` own property or on which to create it when `newInstance` param is given.
     * @param  {Metadata} [newInstance] If no `_meta` property exists on `target` create one with a reference to a `newInstance` of `Metadata`.
     * @return {Metadata}
     */
    static about(target:any, newInstance?:Metadata):Metadata {
        if (target) {
            if (newInstance && !target.hasOwnProperty("_meta")) {
                target._meta = newInstance;
            }
            return target._meta;
        }
    }

    /**
     * Some metadata can be set via decorators, other metadata
     * such as associations can only be completed with the first
     * instantiation of an entity.
     * @internal
     */
    isComplete(value?:boolean): boolean {
        if (value) {
            this.$isComplete = value;
        }
        return this.$isComplete;
    }

    getClassName() {
        return this.$name;
    }

    setClassName(name) {
        this.$name = name;
    }

    getSuperClass() {
        return this.$superclass;
    }

    setSuperClass(ctor) {
        this.$superclass = ctor;
    }

    getFields() {
        return this.$fields;
    }

    getIdProperty() {
        return this.$idProperty;
    }

    setIdProperty(propName) {
        this.$idProperty = propName;
    }

    addField(field: Field) {
        var fieldName = field.get("name");
        this.$fields[fieldName] = field;
        this.$aliases[field.get("plain") || fieldName] = fieldName;
    }

    getField(fieldName: string) {
        return this.$fields[fieldName];
    }

    getFieldNameByAlias(alias: string) {
        return this.$aliases[alias];
    }

    addAssociation(a: Association) {
        this.$associations.add(a);
    }

    getAssociations() {
        return this.$associations;
    }
}
