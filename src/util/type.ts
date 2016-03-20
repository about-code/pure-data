/**
 * The module returns an object with methods to use for getting the type or testing
 * for the type of a value. It aims at reducing errors which even experienced
 * developers are likely to run into due to the rather unintuitive JavaScript
 * type system. The tests provided by this module apply more intuitive type
 * semantics such as returning *false* for `NaN` when testing for `isNumber()`.
 *
 * Likewise, the `isObject()` check does only return *true*, for a value of
 * JavaScript type [object Object] or [object Arguments] or [object Date]. This
 * means in contrast to the native `typeof` it will return *false* for `null` as
 * well as for arrays. Arrays instead are considered object-*like*. Therefore you
 * may use `isObjectlike()` if you want to get *true* for objects and Arrays but
 * still not for `null`. If you like to test with native JavaScript object
 * interpretation you may use `isJsObject` which internally tests with
 * `typeof x === 'object'`. While in the latter case, you could write the test
 * on your own, of course, using `isJsObject` might signal to the reader of your
 * code that you were concious about the native object semantics and that you
 * explicitely accepted `null` as possible value of `x`.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin
 *
 * @module util/type
 */
export var type = {

    /**
     * Get the type of a value. It returns the lowercased type
     * specific portion of the result of calling toString(), so
     * for an array it returns "array" rather than "[object Array]".
     *
     * @param {*} arg The value to get the type of.
     */
    get: function(arg) {
        var t = Object.prototype.toString.call(arg);
        switch (t) {
            case "[object Boolean]": return "boolean";
            case "[object Number]": return "number";
            case "[object String]": return "string";
            case "[object Object]": return "object";
            case "[object Array]":  return "array";
            case "[object Date]":   return "date";
            case "[object Function]":  return "function";
            case "[object Undefined]": return "undefined";
            case "[object Arguments]": return "arguments";
            case "[object Null]": return "null";
            default:
                return t.substr("[object ".length, t.length - "[object ]".length).toLowerCase();
        }
    },

    /**
     * @param {*} arg
     * @return true if arg is a function, false otherwise.
     */
    isFunction: function(arg) {
        return typeof arg === "function";
    },


    /**
     * @param {*} arg
     * @return true if arg is an object (neither null, nor array).
     */
    isObject: function(arg) {
        var t = Object.prototype.toString.call(arg);
        return t === "[object Object]" || t === "[object Arguments]" || t === "[object Date]";
    },

    /**
     * @param {*} arg
     * @return true if arg is an object or an array or "array-like" like the
     * magic variable 'arguments', false otherwise (e.g. null, undefined, "a", 1)
     */
    isObjectlike: function(arg) {
        var t = Object.prototype.toString.call(arg);
        return this.isObject(arg) || t === "[object Array]";
    },


    /**
     * Alias for 'typeof arg === "object"'
     * @param {*} arg
     * @return true for arg being an object, an array or null (JavaScript object semantics), false otherwise.
     */
    isJsObject: function(arg) {
        return typeof arg === "object";
    },

    /**
     * @param {*} arg
     * @return true for arg being typeof [object Array] only, false otherwise
     * (e.g. for magic variable 'arguments')
     */
    isArray: function(arg) {
        return (arg instanceof Array) || this.isCollection(arg); //Object.prototype.toString.call(arg) === "[object Array]";
    },

    isCollection: function(arg) {
        return !!(arg && arg.isCollection);
    },

    /**
     * @param {*} arg
     * @return true for arg being typeof [object Array] or [object Arguments] only, false otherwise.
     */
    isArraylike: function(arg) {
        var t = Object.prototype.toString.call(arg);
        return this.isArray(arg) || t === "[object Arguments]";
    },

    /**
     * @param {*} arg
     * @return true, if arg is a string or a finite number, false for anything
     * else (e.g. NaN, Infinity, null, undefined)
     */
    isPrimitive: function(arg) {
        return typeof arg === "string" || typeof arg === "boolean" || (typeof arg === "number" && isFinite(arg));
    },

    /**
     * @param {*} arg
     * @return true, if arg is what JavaScript's typeof operator would classify
     * as string or number (including NaN or Infinity).
     */
    isJsPrimitive: function(arg) {
        return typeof arg === "string" || typeof arg === "boolean" || typeof arg === "number";
    },

    /**
     * @param {*} arg
     * @return true, if and only if arg is a boolean.
     */
    isBoolean: function(arg) {
        return Object.prototype.toString.call(arg) === "[object Boolean]";
    },

    /**
     * @param {*} arg
     * @return true, if and only if arg is a string.
     */
    isString: function(arg) {
        return typeof arg === "string";
    },

    /**
     * @param {*} arg
     * @return true, if and only if arg is an integer (Number strings resolve to false).
     */
    isInteger: function(arg) {
        return (arg % 1 === 0) && typeof arg === "number";
    },

    /**
     * @param {*} arg
     * @return true, if arg is an integer or a number string denoting an integer, false for boolean and others.
     */
    isIntegerlike: function(arg) {
        return (arg % 1 === 0) && (typeof arg === "number" || typeof arg === "string");
    },

    /**
     * @param {*} arg
     * @return true, if and only if arg is a finite number, false for anything else (including NaN, +Infinity, -Infinity, number strings);
     */
    isNumber: function(arg) {
        return typeof arg === "number" && isFinite(arg);
    },


    /**
     * @param {*} arg
     * @return true, if arg is a number (including +Infinity, -Infinity))
     */
    isJsNumber: function(arg) {
        return typeof arg === "number";
    },

    /**
     * @param {*} arg
     * @return true, if arg is a finite number or a finite-number string, false for anything else (including NaN, +Infinity, -Infinity).
     */
    isNumeric: function(arg) {
        return isFinite(parseFloat(arg));
    },

    /**
     * Alias for isNumeric.
     * @param {*} arg
     * @return true, if arg is a finite number
     */
    isFinite: function(arg) {
        return this.isNumeric(arg);
    },

    /**
     * Alias for JavaScript's default isFinite.
     * @function
     * @param {*} arg
     * @return true, if arg is a finite number or number string
     */
    isJsFinite: isFinite,

    /**
     * @param {*} arg
     */
    isNull: function(arg) {
        return arg === null;
    },

    /**
     * Some value is considered to be defined if it is neither 'undefined'
     * 'NaN' nor 'Infinity'.
     *
     * Note that this function considers null to be "defined". Use
     * `isInitialized()` if you want to test whether some argument
     * is defined and not null.
     *
     * @param {*} arg
     * @return true for anything, except for arg being undefined, NaN or (-)Infinity.
     */
    isDefined: function(arg) {
        if (arg === undefined || (typeof arg === "number" && (isNaN(parseFloat(arg)) || Math.abs(arg) === Infinity))) {
            return false;
        }
        return true;
    },

    /**
     * @param {*} arg
     * @return true for anything not being undefined.
     */
    isJsDefined: function(arg) {
        return arg !== undefined;
    },

    /**
     * @param {*} arg
     * @return true if arg isDefined() AND not null.
     */
    isInitialized: function(arg) {
        // see also isDefined()
        if (arg === null || arg === undefined || (typeof arg === "number" && (isNaN(parseFloat(arg)) || Math.abs(arg) === Infinity))) {
            return false;
        }
        return true;
    },

    /**
	 * @param {function} Ctor The type `arg` may or may not be an instance of
	 * @param {any} arg The argument to test for being an instance of `Ctor`
	 * @return {boolean} *true* if `arg` is an instance of `Ctor`, *false* otherwise
	 */
	isInstanceOf: function(Ctor, arg)  {
		return this.isFunction(Ctor) && this.isObjectlike(arg) && (arg instanceof Ctor || (this.isFunction(arg.isInstanceOf) && arg.isInstanceOf(Ctor)));
	},

    /**
     * Helpers for strict typing. They throw errors for any type violations.
     */
    assertFunc: function(arg, msg) {
        if (this.isFunction(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Function] but got: " + Object.prototype.toString.call(arg));
    },

    assertJsObject: function(arg, msg) {
        if (this.isJsObject(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Object|Array|Arguments|Null] but got: " + Object.prototype.toString.call(arg));
    },


    assertObjectlike: function(arg, msg) {
        if (this.isObjectlike(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Object|Array|Arguments] but got: " + Object.prototype.toString.call(arg));
    },

    assertObject: function(arg, msg) {
        if (this.isObject(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Object|Arguments] but got: " + Object.prototype.toString.call(arg));
    },

    assertArray: function(arg, msg) {
        if (this.isArray(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Array] but got: " + Object.prototype.toString.call(arg));

    },

    assertArraylike: function(arg, msg) {
        if (this.isArraylike(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Array|Arguments] but got: " + Object.prototype.toString.call(arg));
    },

    assertPrimitive: function(arg, msg) {
        if (this.isPrimitive(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object String|Number|Boolean] but got: " + Object.prototype.toString.call(arg));
    },

    assertBoolean: function(arg, msg) {
        if (this.isBoolean(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Boolean] but got: " + Object.prototype.toString.call(arg));
    },

    assertString: function(arg, msg) {
        if (this.isString(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object String] but got: " + Object.prototype.toString.call(arg));
    },

    assertJsNumber: function(arg, msg) {
        if (this.isJsNumber(arg)) {
            return arg;
        }
        throw new Error(msg || "Type violation: expected [object Number] but got: " + Object.prototype.toString.call(arg));
    },

    assertNumber: function(arg, msg) {
        if (this.isNumber(arg)) {
            return arg;
        }
        // Note: can't use Object...toString() here because NaN or Infinity would also resolve to [object Number]...
        throw new Error(msg || "Expected argument to be a finite number but got: " + arg);
    },

    assertNumeric: function(arg, msg) {
        if (this.isNumeric(arg)) {
            return arg;
        }
        throw new Error(msg || "Expected argument to be a finite number or numeric string but got: " + arg);
    },

    assertFinite: function(arg, msg) {
        return this.assertNumeric(arg, msg);
    },

    assertJsFinite: function(arg, msg) {
        if (isFinite(arg)) {
            return arg;
        }
        throw new Error(msg || "Expected argument to be a javascript finite number or numeric string but got: " + arg);
    },

    assertNotNull: function(arg, msg) {
        if (this.isNull(arg)) {
            throw new Error(msg || "Expected argument to be not null but got: " + arg);
        }
        return arg;
    },

    assertDefined: function(arg, msg) {
        if (this.isDefined(arg)) {
            return arg;
        }
        throw new Error(msg || "Expected argument to be defined but got: " + arg);
    },

    assertInitialized: function(arg, msg) {
        if (this.isInitialized(arg)) {
            return arg;
        }
        throw new Error(msg || "Expected argument to be defined and not null but got: " + arg);
    }
}
