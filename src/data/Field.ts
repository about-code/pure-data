"use strict";
import {BehaviorSubject} from "rxjs";
import {SimpleMap} from "../collection/collection";
import {IObjectChangeRecord} from "./IObjectChangeRecord.d";
import {Observable} from "./Observable";
import {Metadata} from "./Metadata";
import {EntityManager} from "./EntityManager";
import {Log, type, defaults} from "../util/util";

var log = Log.getLogger("data/Field");

export interface IFieldConfig {
    name: string;
    // datatypes and relationships
    type?: string;
    dtype?: Function|string;
    inverse?: string;
    // computed properties
    dependsOn?: string[];
    getValue?: Function;
    setValue?: Function;
    // mapping
    plain?: string;
    formatter?: Function;
    parser?: Function;
    ignore?: boolean|string;
    // validation
    validator?:Function;
    // misc.
    flags?: string;
}

/**
 * A Field holds metadata about a Model property. Instances will primarily
 * be created using the **@field** decorator within a model class declaration.
 *
 * ```typescript
 *  @datatype("MyClass")
 *  class MyClass {
 *
 *      @field({ignore: true})
 *      myField: string = "Don't serialize me";
 *
 *      @field({parser: MyClass.isoToDate})
 *      myDate: Date = null;
 *
 *      static isoToDate(isoString:string):Date {
 *          return new Date(isoString);
 *      }
 *  }
 * ```
 * Fields allow to specify whether particular model properties are serialized
 * or deserialized and, if they are, how values are parsed as part of deserialization
 * or formatted on serialization. Further, fields are used to specify associations
 * between model types.
 *
 * A concrete [[Field]] instance represents a model property
 * on the type level. Its lifetime will be independent from a particular model
 * instance.
 *
 * > [[Field]] instances hold type-level information shared by multiple [[OwnField]]
 * instances on the instance level.
 *
 * We could, for example, instantiate a Field with `new` (though, this is not
 * recommended):
 * ```
 *    var f_free = new Field({name: "test"});
 * ```
 * `f_free` lives on its own. However, we can create a field which is *owned* by a
 * concrete object by calling `getOwnField()` on `f_free` and passing the owning
 * object:
 * ```
 *    var owner = {};
 *    var f_owned = f_free.getOwnField(owner)
 * ```
 * If we now write
 * ```
 *    f_owned.put("newValue")
 * ```
 * then `owner["test"]` gets assigned `"newValue"`. The returned [[OwnField]] also
 * acts as a proxy, so a statement `f_owned.test = "newValue"` actually runs
 * [[OwnField.put]] as shown before.
 *
 * The concept of Field vs. OwnField is very similar to JavaScript's prototype
 * property vs. own property concept. In fact a [[Field]] instance shared by many
 * [[OwnField]] instances could have been made the prototype of [[OwnField]]
 * instances (e.g. using delegation pattern by [Crockford]). But
 *
 *  1. because there can be many [[OwnField]] instances and
 *  2. because modifying their prototype is more costly than just setting a normal object reference and
 *  3. because we don't necessarily need prototype property inheritance between Field and OwnField instances
 *
 * [[OwnField]] instances point to their [[Field]] instance via a simple `_meta` property
 * rather than via the `prototype` property. Instead of accessing `_meta` directly we can
 * use [[Metadata.about]] to get the [[Field]] reference for an [[OwnField]]:
 * ```
 *    console.log(Metadata.about(f_owned).name)
 * ```
 *
 * #### Lifetime of OwnField:
 * OwnFields in general won't become automatically destroyed when
 * its owner is destroyed, except if *owner* is an instance of [[Model]].
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 * @see [[Model]]
 */
export class Field extends Observable {

    name = null;

    /**
     * JavaScript value type. One of "any", "array", "object", "number", "string", "boolean" or "";
     */
    type:string = "";

    /**
     * A constructor function or unique @datatype name denoting the data type
     * of the field. If `_dtype` is an @datatype name the name is is used to
     * lookup the proper constructor from the EntityManager's static registry
     * of known entities.
     */
    private _dtype:Function|string = null;

    /**
     * A string with a comma-separated listing of HTTP Verbs for which a
     * field won't be (de-)serialized, e.g. `"POST,PUT"`. Use the wildcard
     * `true` to always ignore.
     */
    ignore:string|boolean = false;

    /**
     * Possible values:
     *
     * - "FK": Tell serializer to render entities only by their IDs
     * - "freeze": (experimental) TODO</li>
     * - "seal": (experimental) TODO</li>
     */
    flags:string = "";
    private _flags:SimpleMap<string> = null;

    dependsOn: string[] = null;
    getValue: {(): any;} = null;
    setValue: {(newValue:any):any;} = null;

    /**
     * @param {IFieldConfig} args The properties to mix into the instance.
     * @param {string} [fieldName] Field name
     */
    constructor(args: IFieldConfig, fieldName?) {
        super();
        var t;
        /* init defaults on 'this' */
        defaults(args, {
            name: fieldName || null,
            // datatypes and relationships
            type: null,
            dtype: null,
            inverse: "",
            // computed properties
            dependsOn: [],
            getValue: null,
            setValue: null,
            // mapping
            alias: null,
            formatter: null,
            parser: null,
            ignore: false,
            // validation
            validator:null,
            // misc.
            flags: ""
        }, this);

        if (! this.get("type")) {
            this.set("type", "any");
        }

        // some hint when ctor is expected to be a constructor returned from
        // an AMD module but the module resolved to 'undefined' due to a
        // recursive dependency.
        if (this.dtype === undefined) {
            log.warn(`Value for "dtype" of schema field "${this.name}" ` +
                     "is undefined. You may want to check your AMD dependencies " +
                     "and that they are defined in the right order. In case " +
                     "of recursive dependencies you may set \"dtype\" to be an " +
                     "AMD module path or wrap your schema into a function " +
                     "in which you require the ctor-module again.");
        }
    }

    /**
     * Get a configuration option for this field
     * @param {string}
     */
    get(name):any {
        return this[name];
    }

    /**
     * Set a configuration option for this field
     * @param {string}
     * @param {*}
     */
    set(name:string, newValue:any) {
        if (name === "flags") {
            this._flags = this.mapFlags(newValue);
        }
        this[name] = newValue;
    }

    get dtype() {
        if (typeof this._dtype !== "string") {
            return this._dtype;
        } else {
            return EntityManager.getEntityTypeCtor(this._dtype) || this._dtype;
        }
    }

    set dtype(value: {new();} | string) {
        this._dtype = value;
    }

    get dtypeName() {
        if (typeof this._dtype === "string") {
            return this._dtype;
        } else {
            let knownType = EntityManager.getEntityTypeCtor(this._dtype);
            if (knownType) {
                return Metadata.aboutClassOf(knownType).getClassName();
            } else {
                return undefined;
            }
        }
    }

    /** @param {string} flag The flag to look for */
    hasFlag(flag:string) {
        return !!this._flags[flag];
    }

    /**
     * @param {Object} owner The instance which ows the returned field.
     * The returned field is bound to its owner.
     */
    getOwnField(owner:Object) {
        return new OwnField(owner, this);
    }

    private mapFlags(flags):SimpleMap<string> {
        var map:any = {},
            tmp;
        if (flags) {
            tmp = flags.split(",");
            for (var i=0, len = tmp.length; i < len; i += 1) {
                map[tmp[i]] = true;
            }
        }
        return map;
    }
};

/**
 * @see [[Field]]
 * @private
 */
export class OwnField extends Observable {

    private _notifyArrayChanged:Function = null;
    private _updateRecord:IObjectChangeRecord = null;
    private _valueStream = {
        isStub: true,
        onNext: function(newValue, oldValue, name) {
            return;
        }
    };
    private _isStable:boolean = true;

    dirty:boolean = false;
    errors:Array<any> = null;
    value:any = null;
    _meta:Field = null;
    owner:Object = null;

    constructor(owner:Object, metaField:Field) {
        super();
        // ownedValue is required by the superclass constructor.
        var self = this,
            name = metaField.name,
            ownedValue = owner.hasOwnProperty(name) ? owner[name] : undefined;

        this._meta = metaField;
        this.owner = owner;
        this.value = ownedValue;
        this.value = this.valueOf(true); // Computed properties: force initial value computation or assign this.value again.

        // Subscribe to fields this field depends on...
        for (let i = 0, iLen = this._meta.dependsOn.length; i < iLen; i += 1) {
            if (type.isFunction(owner.field)) {
                owner.field(this._meta.dependsOn[i]).values().subscribe(() => this.recompute());
            }
        }

        // We need to pass the same function reference to array.unobserve or
        // array.unobserveSync() which we passed to observe() or observeSync().
        this._notifyArrayChanged = (changes) => this.notifyChanged(changes);

        // set observer for initial value, if it is an array.
        if (type.isArray(ownedValue)) {
            Array.observeSync(ownedValue, this._notifyArrayChanged);
        }

        // Define getter/setter for field on owner, using ES5's Object.defineProperty()
        Object.defineProperty(owner, name, {
            get: function() {
                return self.valueOf();
            },
            set: function(value) {
                return self.put(value);
            }
        });
    }

    /*
     * Getting the field value. If the field is a computed field with a `dependsOn` configuration the returned value is
     * automatically recomputed once one of the properties it depends on changed. Alternatively you you can manually enforce
     * recomputation by calling `valueOf(true)`.
     */
    valueOf(recompute?:boolean) {
        return recompute ? this.recompute() : this.value;
    }

    /*
     * Change the field value.
     * @param {*} newValue.
     */
    put(newValue:any) {

        var that = this,
            owner = this.owner,
            name = this._meta.name,
            oldValue = this.valueOf(),
            tmpValue = null,
            changeRecord: IObjectChangeRecord = null,
            newValueComputed; // see BehaviorSubject

        if (this._isStable === false && oldValue !== newValue) {
            log.warn("Attempt to write value ", newValue,
                " to field '" + name + "' of ", owner,
                " while the field is just about to be written. Value"+
                " won't persist after the outer write has finished. Did"+
                " you attempt to write the field in a field"+
                " observer? Don't do it. Did you attempt to write the (computed)"+
                " field in a \"setValue\" callback? Just return the computed result."
            );
            log.trace();
        }

        this._isStable = false;
        if (typeof this._meta.setValue === "function") {
            tmpValue = this._meta.setValue.call(owner, newValue);
            if (tmpValue !== undefined) {
                newValue = tmpValue;
            }
        }
        if (oldValue !== newValue) {
            this.value = newValue;
            this.dirty = true;

            // register listener on array value to notify observers about
            // changes to the array
            if (type.isArray(newValue)) {
                Array.observeSync(newValue, this._notifyArrayChanged);
            }
            if (type.isArray(oldValue)) {
                Array.unobserveSync(oldValue, this._notifyArrayChanged);
            }

            // write new value to value stream
            this._valueStream.onNext(newValue, oldValue, name);

            // generate change record and write it to changes stream
            // (see Observable.notifyChanged)
            changeRecord = {
                type: "update",
                name: name,
                object: owner,
                oldValue: oldValue,
            };
            this.notifyChanged([changeRecord]);

            // Guarantee temporary changes introduced by change listeners won't last.
            // Otherwise the semantics of the assignment operator is overloaded by enabling
            //  x.p =   "value";
            //  x.p === "value"; // => false
            // because "value" might have been mutated by some field
            // listener which has been invoked during the assignment
            // this.value = newValue;
        }
        this._isStable = true;
    }

    set(propName:string, propValue:any) {
        this[propName] = propValue;
    }

    get(propName:string) {
        // getter to read metadata properties
        return this[propName];
    }

    /**
     * @return RxJS BehaviorSubject representing this field's value stream
     * (see also [RxJS](https://www.github.com/reactive-extensions/rxjs).
     * Writing new values to the stream via the stream's `onNext()` method
     * will modify the field's value but without notifying any observers
     * which are listening on the field's `changes()`-stream or which have
     * been registered via the field's `observeSync()` method. Use `put()`
     * if you want these to be notified, too.
     */
    values() {
        if (this._valueStream.isStub) {
            this._valueStream = new BehaviorSubject(this.value);
        }
        return this._valueStream.asObservable();
    }

    isDirty():boolean {
        return this.dirty;
    }

    isValid():boolean {
        if (typeof this.validator === "function") {
            return this.validator.call(this, this.valueOf());
        } else {
            return true;
        }
    }

    hasFlag(flag:string):boolean {
        return this._meta.hasFlag(flag);
    }

    hasErrors():boolean {
        throw new Error("Not yet implemented.");
    }

    destroy() {
        this.closeRxStream(this._valueStream);
    }

    private recompute() {
        if (typeof this._meta.getValue === "function") {
            this.put(this._meta.getValue.call(this.owner));
        }
        return this.value;
    }

    /**
     * @override
     * @param  {[type]} changes [description]
     * @return {[type]}         [description]
     */
    protected notifyChanged(changes: Array<IObjectChangeRecord>) {
        var i, len;
        super.notifyChanged(changes);
        if (type.isFunction(this.owner.notifyChanged)) {
            this.owner.notifyChanged(changes);
            this._meta.notifyChanged(changes);
        }
    }

    protected closeRxStream(stream) {
        var completed, disposed;
        if (stream) {
            completed = stream.onCompleted && stream.onCompleted();
            disposed  = stream.dispose     && stream.dispose();
        }
    }
};
