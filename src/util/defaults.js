/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @module util/defaults
 */
define([
    "./type"
], function(type) {

    /**
     * Can be used to check an object for existence and validity of
     * properties and set a default value for missing or invalid properties.
     * Similar to Underscore's `_.defaults()`.
     * Example:
     * ```
     * function () {
     *    var actual, expected, result;
     *    expected = {
     *        name: "",
     *        surname: "Panther",
     *        sex: function(p, value) {
     *            var enum = {m: "male", f: "female", o: "other"};
     *            return enum[actual] || "other";
     *        }
     *    },
     *    actual = {
     *        name: "Paul"
     *    },
     *    result = defaults(actual, expected);
     *    console.log(result);
     * }
     * ```
     * The above example uses a function for `sex` to validate a given value and
     * return a default value if the given value is undefined or invalid.
     * The result of above operation will be
     * ```
     * {
     *     name: "Paul",            // given
     *     surname: "Panther",      // default
     *     sex: "other"             // default
     * }
     * ```
     * @alias module:util/defaults
     * @param {object} args the object to test
     * @param {object} defaults the defaults
     * @param {object} [target={}] where to append initialized properties
     */
    var defaults = function (args, defaults, target) {
        var i = 0,
            iLen = 0,
            result = target || {},
            visited = {},
            props,
            setter = result.set ? result.set : function(pName, pValue) {
                this[pName] = pValue;
            };

        if (!type.isObject(args)) {
            args = {};
        }
        props = [].concat(Object.getOwnPropertyNames(defaults), Object.getOwnPropertyNames(args));
        iLen = props.length;
        for (i = 0; i < iLen; i += 1) {
            p = props[i];
            if (!visited[p]) {
                visited[p] = true;
                if (defaults.hasOwnProperty(p)) {
                    if (args.hasOwnProperty(p)) {
                        // p in args and defaults. if there's a validator apply it
                        if (typeof defaults[p] === "function") {
                            setter.call(result, p, defaults[p].call(defaults, args[p], p));
                        } else {
                            setter.call(result, p, args[p]);
                        }
                    } else {
                        // p in defaults, only. if there's a validator apply it (must return the default value)
                        if (typeof defaults[p] === "function") {
                            setter.call(result, p, defaults[p].call(defaults, undefined, p));
                        } else {
                            setter.call(result, p, defaults[p]);
                        }
                    }
                } else {
                    // p in args, only. No default specified.
                    setter.call(result, p, args[p]);
                }
            }
        }
        return result;
    };

    return defaults;
});
