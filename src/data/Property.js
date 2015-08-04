/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @description
 * Instances of properties are generated from a {@link data/Model|Model}'s
 * schema. You can get OwnProperty objects for [Model](./Model.html) instances
 * via a Model's [`property()`](./Model.html#property) method.
 *
 * #### Properties and Owned Properties
 * > This section is intended for the advanced reader interested in knowing some
 * of the library internals.
 *
 * Properties occur in two flavours. A {@link data/Property|Property} instance
 * represents a property of a schema (the type level). It is instantiated
 * independent from a particular entity instance, e.g. we can instantiate a
 * Property with `new`:
 * ```
 *    var p_free = new Property({name: "test"});
 * ```
 * `p_free` lives on its own. Its a property of anything and nothing. However, we
 * can create a property from it which is *owned* by a concrete object by
 * calling `getOwnProperty()` on `p_free` and passing the owning object:
 * ```
 *    var owner = {};
 *    var p_owned = p_free.getOwnProperty(owner)"
 * ```
 * If we now write
 * ```
 *    p_owned.put("newValue")
 * ```
 * then `owner["test"]` gets assigned `"newValue"`. We can get meta information about
 * `p_owned` via its `metadata` property, e.g.
 * ```
 *    console.log(p_owned.metadata.name)
 * ```
 * So {@link data/Property|Property} instances hold (entity-) type-level information
 * shared by owned properties on the (entity-) instance level. The concept of
 * Property vs. OwnProperty is very similar to JavaScript's prototype property vs. own
 * property concept. In fact, we would have set the Property instances on the
 * prototype of all of their corresponding OwnProperty instances (using delegation
 * pattern [Crockford]), if modifying the prototype of JavaScript objects wouldn't
 * be quite costly. For performance reasons any OwnProperty instance holds a
 * reference to its meta Property instance via `metadata` instead.
 *
 * **Note that OwnProperties in general won't become automatically destroyed when
 * its owner is destroyed.** Users of {@link data/Model|Models} don't have to worry
 * about this as Models destroy their OwnProperties within of their `destroy()`
 * method. But be aware of it if you plan to facilitate {@link data/Property|Property}
 * and {@link data/OwnProperty|OwnProperty} elsewhere.
 *
 * #### Reactivity
 * see [Reactivity](./tutorial-reactivity.html)
 *
 * @constructor data/Property
 * @param {object} args The properties to mix into the instance.
 * @see data/Model
 * @tutorial data-modeling
 * @tutorial reactivity
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/aspect",
    "rxjs",
    "./Observable",
    "../util/type",
    "../util/log!data/Property",
    "../util/defaults"
], function(declare, lang, aspect, Rx, Observable, type, log, defaults) {

    var BehaviorSubject = Rx.BehaviorSubject;

    function mapFlags(flags) {
        var map = {},
            tmp;
        if (flags) {
            tmp = flags.split(",");
            for (var i=0, len = tmp.length; i < len; i += 1) {
                map[tmp[i]] = true;
            }
        }
        return map;
    }

    function closeRxStream(stream) {
        var completed, disposed;
        if (stream) {
            completed = stream.onCompleted && stream.onCompleted();
            disposed  = stream.dispose     && stream.dispose();
        }
    }

    var Property = declare([Observable], /**@lends data/Property.prototype*/ {

        /**
         * Default value to initialize the property
         * @type {*}
         */
        default: null,

        /**
         * JavaScript value type
         * @type {string}
         */
        type: "",

        /**
         * A constructor function or AMD module path. When an entity is
         * deserialized from a plain object, then this constructor is used to
         * instantiate a object which is configured with the plain property
         * value.
         * @type {(function|string)}
         */
        dtype: null,

        /**
         * A string with a comma-separated listing of HTTP Verbs for which a
         * property is serialized, e.g. `"GET,POST,PUT"`. Use the wildcard `*`
         * or empty string, to always serialize.
         * @type {string}
         */
        scenario: "",

        /**
         * Possible values:
         *
         * - "FK": Tell serializer to render entities only by their IDs
         * - "freeze": (experimental) TODO</li>
         * - "seal": (experimental) TODO</li>
         * @type {string}
         */
        flags: "",

        /** @type {function} */
        getValue: null,

        /** @type {function} */
        setValue: null,

        dependsOn: null,

        constructor: function (args, pName) {
            var t,
                jsonSchemaTypes = "boolean number string object array date";
            /* init defaults on 'this' */
            defaults(args, {
                default: function(v) {
                    if (type.isFunction(v)) {
                        return v.call(undefined, v);
                    } else {
                        return v;
                    }
                },
                name: pName || null,
                // datatypes and relationships
                type: null,
                dtype: null,
                inverse: "",
                // computed properties
                dependsOn: [],
                getValue: null,
                setValue: null,
                // mapping
                plain: null,
                formatter: null,
                parser: null,
                scenario: "*",
                // validation
                validator:null,
                // misc.
                flags: ""
            }, this);

            // this.set(this.default);

            if (args && (args.get || args.set)) {
                throw new Error("Can't use 'get' or 'set' for computed properties. " +
                    "Use 'getValue' or 'setValue' instead.", this);
            }

            if (! this.get("type")) {
                t = type.get(this.default);
                if (jsonSchemaTypes.indexOf(t) >= 0) {
                    this.set("type", t);
                } else {
                    this.set("type", "any");
                }
            }

            // some hint when ctor is expected to be a constructor returned from
            // an AMD module but the module resolved to 'undefined' due to a
            // recursive dependency.
            if (this.dtype === undefined) {
                log.warn('Value for "dtype" of schema property "' + this.name +
                         '" is undefined. You may want to check your AMD dependencies ' +
                         'and that they are defined in the right order. In case ' +
                         'of recursive dependencies you may set "dtype" to be an ' +
                         'AMD module path or wrap your schema into a function ' +
                         'in which you require the ctor-module again.');
            }
        },

        /**
         * Get a configuration option for this property
         * @param {string}
         */
        get: function(name) {
            return this[name];
        },

        /**
         * Set a configuration option for this property
         * @param {string}
         * @param {*}
         */
        set: function(name, newValue) {
            if (name === "flags") {
                this._flags = mapFlags(newValue);
            }
            this[name] = newValue;
        },

        /** @param {string} flag The flag to look for */
        hasFlag: function(flag) {
            return !!this._flags[flag];
        },

        /**
         * @param {Object} owner The instance which ows the returned property.
         * The returned property is bound to its owner.
         */
        getOwnProperty: function(owner) {
            return new OwnProperty(owner, this);
        }
    }),

    /**
     * @see {@link data/Property}
     * @constructor data/OwnProperty
     * @private
     */
    OwnProperty = declare([Observable],/** @lends data/OwnProperty.prototype */ {

        _notifyArrayChanged: null,
        _updateRecord : null,
        _valueStream: {
            isStub: true,
            onNext: function(newValue, oldValue, name) {}
        },
        dirty: false,
        errors: null,
        value: null,

        constructor: function(owner, metaProperty) {
            // ownedValue is required by the superclass constructor.
            var self = this,
                name = metaProperty.name,
                ownedValue = owner.hasOwnProperty(name) ? owner[name] : lang.clone(metaProperty.get("default")),
                i, iLen;

            this.metadata = metaProperty;
            this.owner = owner;
            this.value = ownedValue;
            this.value = this.valueOf(true); // Computed properties: force initial value computation or assign this.value again.

            // Subscribe to properties this property depends on...
            for (i = 0, iLen = this.metadata.dependsOn.length; i < iLen; i += 1) {
                owner.property(this.metadata.dependsOn[i]).values().subscribe(lang.hitch(this, this._recompute));
            }

            // We need to pass the same function reference to array.unobserve or
            // array.unobserveSync() which we passed to observe() or observeSync().
            // Therefore we need to keep the reference returned by lang.hitch...
            this._notifyArrayChanged = lang.hitch(this, this.notifyChanged);

            // set observer for initial value, if it is an array.
            if (type.isArray(ownedValue)) {
                Array.observeSync(ownedValue, this._notifyArrayChanged);
            }

            // Define getter/setter for property on owner, using ES5's Object.defineProperty()
            Object.defineProperty(owner, name, {
                get: function() {
                    return self.valueOf();
                },
                set: function(value) {
                    return self.put(value);
                }
            });
        },

        /*
         * getting the property value
         */
        valueOf: function(boolRecompute) {
            if (boolRecompute && typeof this.metadata.getValue === 'function') {
                // computed property or one with an explicit getter
                this.value = this.metadata.getValue.call(this.owner);
            }
            return this.value;
            //return this.owner[this.metadata.name];
        },

        /*
         * Change the property value.
         * @param {*} newValue.
         */
        put: function(newValue) {

            var owner = this.owner,
                name = this.metadata.name,
                oldValue = this.valueOf(),
                newValueComputed; // see BehaviorSubject

            if (oldValue !== newValue) {
                if (typeof this.metadata.setValue === 'function') {
                    this.metadata.setValue.call(owner, newValue, owner);
                    newValue = this.valueOf(true);
                }

                // register listener on array value to notify observers about
                // changes to the array
                if (type.isArray(newValue)) {
                    Array.observeSync(newValue, this._notifyArrayChanged);
                }
                if (type.isArray(oldValue)) {
                    Array.unobserveSync(oldValue, this._notifyArrayChanged);
                }

                this.value = newValue;
                this.dirty = true;

                // TODO: keep oldValue and changeRecord if event delivery is delayed...

                // write new value to value stream
                this._valueStream.onNext(this.value, oldValue, name);

                // generate change record and write it to changes stream
                // (see Observable#notifyChanged)
                changeRecord = {
                    type: "update",
                    name: name,
                    object: owner,
                    oldValue: oldValue,
                };
                this.notifyChanged([changeRecord]);
            }
        },

        set: function(propName, propValue) {
            this[propName] = propValue;
        },

        get: function(propName) {
            // getter to read metadata properties
            return this[propName];
        },

        notifyChanged: function(changes) {
            var i, len;
            this.inherited(arguments);
            if (type.isFunction(this.owner.notifyChanged)) {
                this.owner.notifyChanged(changes);
                this.metadata.notifyChanged(changes);
            }
        },

        /**
         * @return RxJS BehaviorSubject representing this property's value stream
         * (see also [RxJS](https://www.github.com/reactive-extensions/rxjs).
         * Writing new values to the stream via the stream's `onNext()` method
         * will modify the property's value but without notifying any observers
         * which are listening on the property's `changes()`-stream or which have
         * been registered via the property's `observeSync()` method. Use `put()`
         * if you want these to be notified, too.
         */
        values: function() {
            if (this._valueStream.isStub) {
                this._valueStream = new BehaviorSubject(this.value);
            }
            return this._valueStream;
        },

        isDirty: function() {
            return this.dirty;
        },

        hasFlag: function(flag) {
            return this.metadata.hasFlag(flag);
        },

        hasErrors: function() {
            throw new Error("Not yet implemented.");
        },

        validate: function() {
            if (typeof this.validator === "function") {
                return this.validator.call(this, this.valueOf());
            } else {
                return true;
            }
        },

        destroy: function() {
            closeRxStream(this._valueStream);
        },

        _recompute: function() {
            this.put(this.valueOf(true));
        }
    });

    return Property;
});
