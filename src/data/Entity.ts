"use strict";
import {shared} from "../lang/typescript";
import {Destroyable} from "../Destroyable";
import {Log, type} from "../util/util";
import {ID, ID_PROPERTY} from "./Identity";
import {EntityManager} from "./EntityManager";
import {IContext} from "./IContext";

var log = Log.getLogger("data/Entity");

/**
 * This class is the base class for identifiable data types.
 *
 * **Note**: Entities which are instantiated using an implementation of
 * [[IContext]] are guaranteed to exist only once within the
 * context.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */

export class Entity extends Destroyable {

    /**
     * Flag which marks an entity as removed. The entity instance might still
     * live in memory until changes are saved.
     */
    protected $removed:boolean = false;

    /**
     * The context hosting an entity instance and in which the entity instance
     * is guaranteed to exist only once. This property must be set by
     * implementations of [[IContext]], if an instance of this class was
     * created by or attached to a context. Otherwise it may be `null` or
     * `undefined`.
     */
    $context:IContext = null;

    constructor() {
        super();
    }

    /**
     * Post-constructor() logic and initializer. Should always be called after new
     * instances have been created using `new`. You may want to use a factory
     * which does that for you, e.g. [[EntityManager]].
     *
     * `constructed()` also addresses the case of running parent constructor logic
     * *after* subclass constructor logic. This is not possible with `constructor()`
     * because TypeScript/ECMAScript insists on `super()` being in the first line of
     * a subclass constructor which means any sublcass constructor logic can only be
     * run after the parent class' constructor has finished.
     *
     * @param {string|number|object} data An entity identifier (string or number) or
     * entity data (object) to mix into the instance.
     */
    constructed(data?:Object) {
        if (type.isPrimitive(data)) {
            this.set(ID_PROPERTY(this), data); // assume primitive 'data' to be an ID
        } else if (type.isObject(data)) {
            this.set(ID_PROPERTY(this), ID(data));
        }
    }

    merge(data:Object) {
        return;
    }

    /**
     * @param {string} propName
     * @param {*} newValue
     */
    set(propNameOrHash:any, value?:any) {
        var p,
            oldValue,
            newValue,
            instance,
            context = this.$context;

        if (typeof propNameOrHash === "string") {
            p = propNameOrHash;
            propNameOrHash = {};
            propNameOrHash[p] = value;
        }

        for (p in propNameOrHash) {
            if (propNameOrHash.hasOwnProperty(p)) {
                oldValue = this[p];
                newValue = propNameOrHash[p];
                if (oldValue !== newValue) {
                    if (p === ID_PROPERTY(this) && context) {
                        // note that detaching will set this.$context to null
                        // the entity becomes temporarily unmanaged. Therefore hold
                        // em-instance in a temporary variable.
                        context.detach(this);
                        this[ID_PROPERTY(this)] = newValue;
                        context.attach(this);
                        //this[propName] = newValue; // TODO: why do tests fail when placing it in between detach/attach? New ID should already be set when attaching!!
                    } else {
                        this[p] = newValue;
                    }
                }
            }
        }
    }

    /**
     * @param {string} propName
     * @return {*}
     */
    get(propName:string) {
        return this[propName];
        //return this._get(propName, this._getAttrNames(propName));
    }

    remove() {
        this.$removed = true;
    }

    destroy() {
        if (this.$context) {
            this.$context.detach(this);
        }
    }
};
