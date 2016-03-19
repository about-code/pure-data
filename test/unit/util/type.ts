/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */

import * as registerSuite from "intern!object";
import * as assert from "intern/chai!assert";
import {type as t} from "pure/util/util";

var Ctor = function(){};

registerSuite({
    name: "util/type",
    get: function () {
        // Function
        assert.strictEqual(t.get(Ctor), "function");
        assert.strictEqual(t.get(new Ctor()), "object");
        assert.strictEqual(t.get({}), "object");
        assert.strictEqual(t.get(arguments), "arguments");
        assert.strictEqual(t.get([]), "array");
        assert.strictEqual(t.get(null), "null");
        assert.strictEqual(t.get(undefined), "undefined");
        assert.strictEqual(t.get(true), "boolean");
        assert.strictEqual(t.get("1"), 'string');
        assert.strictEqual(t.get(1), "number");
        assert.strictEqual(t.get(NaN), "number");
        assert.strictEqual(t.get(Infinity), "number");
        assert.strictEqual(t.get(new Date()), "date");
    },
    isFunction: function () {
        // Function
        assert.isTrue( t.isFunction(Ctor), "Ctor");
        assert.isFalse(t.isFunction(new Ctor()), "new Ctor()");
        assert.isFalse(t.isFunction({}), "{}");
        assert.isFalse(t.isFunction(arguments), "arguments");
        assert.isFalse(t.isFunction([]), "[]");
        assert.isFalse(t.isFunction(null), "null");
        assert.isFalse(t.isFunction(undefined), "undefined");
        assert.isFalse(t.isFunction(true), "true");
        assert.isFalse(t.isFunction("1"), '"1"');
        assert.isFalse(t.isFunction(1), "1");
        assert.isFalse(t.isFunction(NaN), "NaN");
        assert.isFalse(t.isFunction(Infinity), "Infinity");
    },
    isObject: function () {
        // Object
        assert.isFalse(t.isObject(Ctor), "Ctor");
        assert.isTrue( t.isObject(new Ctor()), "new Ctor()");
        assert.isTrue( t.isObject({}), "{}");
        assert.isTrue( t.isObject(arguments), "arguments");
        assert.isFalse(t.isObject([]), "[]");
        assert.isFalse(t.isObject(null), "null");
        assert.isFalse(t.isObject(undefined), "undefined");
        assert.isFalse(t.isObject(true), "true");
        assert.isFalse(t.isObject("1"), '"1"');
        assert.isFalse(t.isObject(1), "1");
        assert.isFalse(t.isObject(NaN), "NaN");
        assert.isFalse(t.isObject(Infinity), "Infinity");
    },
    isObjectlike: function () {
        assert.isFalse(t.isObjectlike(Ctor), "Ctor");
        assert.isTrue( t.isObjectlike(new Ctor()), "new Ctor()");
        assert.isTrue( t.isObjectlike({}), "{}");
        assert.isTrue( t.isObjectlike([]), "[]");
        assert.isTrue( t.isObjectlike(arguments), "arguments");
        assert.isFalse(t.isObjectlike(null), "null");
        assert.isFalse(t.isObjectlike(undefined), "undefined");
        assert.isFalse(t.isObjectlike(true), "true");
        assert.isFalse(t.isObjectlike("1"), '"1"');
        assert.isFalse(t.isObjectlike(1), "1");
        assert.isFalse(t.isObjectlike(NaN), "NaN");
        assert.isFalse(t.isObjectlike(Infinity), "Infinity");
    },
    isJsObject: function () {
        assert.isFalse(t.isJsObject(Ctor), "Ctor");
        assert.isTrue( t.isJsObject(new Ctor()), "new Ctor()");
        assert.isTrue( t.isJsObject({}), "{}");
        assert.isTrue( t.isJsObject([]), "[]");
        assert.isTrue( t.isJsObject(arguments), "arguments");
        assert.isTrue( t.isJsObject(null), "null");
        assert.isFalse(t.isJsObject(undefined), "undefined");
        assert.isFalse(t.isJsObject(true), "true");
        assert.isFalse(t.isJsObject("1"), '"1"');
        assert.isFalse(t.isJsObject(1), "1");
        assert.isFalse(t.isJsObject(NaN), "NaN");
        assert.isFalse(t.isJsObject(Infinity), "Infinity");
    },
    isArray: function () {
        assert.isFalse(t.isArray(Ctor), "Ctor");
        assert.isFalse(t.isArray(new Ctor()), "new Ctor()");
        assert.isFalse(t.isArray({}), "{}");
        assert.isTrue( t.isArray([]), "[]");
        assert.isFalse(t.isArray(arguments), "arguments");
        assert.isFalse(t.isArray(null), "null");
        assert.isFalse(t.isArray(undefined), "undefined");
        assert.isFalse(t.isArray(true), "true");
        assert.isFalse(t.isArray("1"), '"1"');
        assert.isFalse(t.isArray(1), "1");
        assert.isFalse(t.isArray(NaN), "NaN");
        assert.isFalse(t.isArray(Infinity), "Infinity");
    },
    isArraylike: function () {
        assert.isFalse(t.isArraylike(Ctor), "Ctor");
        assert.isFalse(t.isArraylike(new Ctor()), "new Ctor()");
        assert.isFalse(t.isArraylike({}), "{}");
        assert.isTrue( t.isArraylike([]), "[]");
        assert.isTrue( t.isArraylike(arguments), "arguments");
        assert.isFalse(t.isArraylike(null), "null");
        assert.isFalse(t.isArraylike(undefined), "undefined");
        assert.isFalse(t.isArraylike(true), "true");
        assert.isFalse(t.isArraylike("1"), '"1"');
        assert.isFalse(t.isArraylike(1), "1");
        assert.isFalse(t.isArraylike(NaN), "NaN");
        assert.isFalse(t.isArraylike(Infinity), "Infinity");
    },
    isPrimitive: function () {
        assert.isFalse(t.isPrimitive(Ctor), "Ctor");
        assert.isFalse(t.isPrimitive(new Ctor()), "new Ctor()");
        assert.isFalse(t.isPrimitive({}), "{}");
        assert.isFalse(t.isPrimitive([]), "[]");
        assert.isFalse(t.isPrimitive(arguments), "arguments");
        assert.isFalse(t.isPrimitive(null), "null");
        assert.isFalse(t.isPrimitive(undefined), "undefined");
        assert.isTrue( t.isPrimitive(false), "false");
        assert.isTrue( t.isPrimitive("1"), '"1"');
        assert.isTrue( t.isPrimitive(1), "1");
        assert.isFalse(t.isPrimitive(NaN), "NaN");
        assert.isFalse(t.isPrimitive(Infinity), "Infinity");
    },
    isJsPrimitive: function () {
        assert.isFalse(t.isJsPrimitive(Ctor), "Ctor");
        assert.isFalse(t.isJsPrimitive(new Ctor()), "new Ctor()");
        assert.isFalse(t.isJsPrimitive({}), "{}");
        assert.isFalse(t.isJsPrimitive([]), "[]");
        assert.isFalse(t.isJsPrimitive(arguments), "arguments");
        assert.isFalse(t.isJsPrimitive(null), "null");
        assert.isFalse(t.isJsPrimitive(undefined), "undefined");
        assert.isTrue( t.isJsPrimitive(false), "false");
        assert.isTrue( t.isJsPrimitive("1"), '"1"');
        assert.isTrue( t.isJsPrimitive(1), "1");
        // Note: NaN itself is considered a number in JS
        assert.isTrue( t.isJsPrimitive(NaN), "NaN");
        assert.isTrue( t.isJsPrimitive(Infinity), "Infinity");
    },
    isBoolean: function () {
        assert.isFalse(t.isBoolean(Ctor), "Ctor");
        assert.isFalse(t.isBoolean(new Ctor()), "new Ctor()");
        assert.isFalse(t.isBoolean({}), "{}");
        assert.isFalse(t.isBoolean([]), "[]");
        assert.isFalse(t.isBoolean(arguments), "arguments");
        assert.isFalse(t.isBoolean(null), "null");
        assert.isFalse(t.isBoolean(undefined), "undefined");
        assert.isTrue( t.isBoolean(false), "false");
        assert.isFalse(t.isBoolean("1"), '"1"');
        assert.isFalse(t.isBoolean(0), "0");
        assert.isFalse(t.isBoolean(1), "1");
        assert.isFalse(t.isBoolean(NaN), "NaN");
        assert.isFalse(t.isBoolean(Infinity), "Infinity");
    },
    isString: function () {
        assert.isFalse(t.isString(Ctor), "Ctor");
        assert.isFalse(t.isString(new Ctor()), "new Ctor()");
        assert.isFalse(t.isString({}), "{}");
        assert.isFalse(t.isString([]), "[]");
        assert.isFalse(t.isString(arguments), "arguments");
        assert.isFalse(t.isString(null), "null");
        assert.isFalse(t.isString(undefined), "undefined");
        assert.isFalse(t.isString(true), "true");
        assert.isTrue( t.isString("1"), '"1"');
        assert.isFalse(t.isString(1), "1");
        assert.isFalse(t.isString(NaN), "NaN");
        assert.isFalse(t.isString(Infinity), "Infinity");
    },
    isInteger: function(arg) {
        assert.isFalse(t.isInteger(Ctor), "Ctor");
        assert.isFalse(t.isInteger(new Ctor()), "new Ctor()");
        assert.isFalse(t.isInteger({}), "{}");
        assert.isFalse(t.isInteger([]), "[]");
        assert.isFalse(t.isInteger(arguments), "arguments");
        assert.isFalse(t.isInteger(null), "null");
        assert.isFalse(t.isInteger(undefined), "undefined");
        assert.isFalse(t.isInteger(true), "true");
        assert.isFalse(t.isInteger(1.2), "1.2");
        assert.isFalse(t.isInteger("1.2"), '"1.2"');
        assert.isFalse(t.isInteger("1"), '"1"');
        assert.isTrue( t.isInteger(1000000000000000000000), "1000000000000000000000");
        assert.isFalse(t.isInteger(NaN), "NaN");
        assert.isFalse(t.isInteger(Infinity), "Infinity");
    },
    isIntegerlike: function(arg) {
        assert.isFalse(t.isIntegerlike(Ctor), "Ctor");
        assert.isFalse(t.isIntegerlike(new Ctor()), "new Ctor()");
        assert.isFalse(t.isIntegerlike({}), "{}");
        assert.isFalse(t.isIntegerlike([]), "[]");
        assert.isFalse(t.isIntegerlike(arguments), "arguments");
        assert.isFalse(t.isIntegerlike(null), "null");
        assert.isFalse(t.isIntegerlike(undefined), "undefined");
        assert.isFalse(t.isIntegerlike(true), "true");
        assert.isFalse(t.isIntegerlike(1.2), "1.2");
        assert.isFalse(t.isIntegerlike("1.2"), '"1.2"');
        assert.isTrue( t.isIntegerlike("1"), '"1"');
        assert.isTrue( t.isIntegerlike(1000000000000000000000), "1000000000000000000000");
        assert.isFalse(t.isIntegerlike(NaN), "NaN");
        assert.isFalse(t.isIntegerlike(Infinity), "Infinity");
    },
    isNumber: function () {
        assert.isFalse(t.isNumber(Ctor), "Ctor");
        assert.isFalse(t.isNumber(new Ctor()), "new Ctor()");
        assert.isFalse(t.isNumber({}), "{}");
        assert.isFalse(t.isNumber([]), "[]");
        assert.isFalse(t.isNumber(arguments), "arguments");
        assert.isFalse(t.isNumber(null), "null");
        assert.isFalse(t.isNumber(undefined), "undefined");
        assert.isFalse(t.isNumber(true), "true");
        assert.isFalse(t.isNumber("1"), '"1"');
        assert.isTrue( t.isNumber(1), "1");
        assert.isFalse(t.isNumber(NaN), "NaN");
        assert.isFalse(t.isNumber(Infinity), "Infinity");
    },
    isJsNumber: function () {
        assert.isFalse(t.isJsNumber(Ctor), "Ctor");
        assert.isFalse(t.isJsNumber(new Ctor()), "new Ctor()");
        assert.isFalse(t.isJsNumber({}), "{}");
        assert.isFalse(t.isJsNumber([]), "[]");
        assert.isFalse(t.isJsNumber(arguments), "arguments");
        assert.isFalse(t.isJsNumber(null), "null");
        assert.isFalse(t.isJsNumber(undefined), "undefined");
        assert.isFalse(t.isJsNumber(true), "true");
        assert.isFalse(t.isJsNumber("1"), '"1"');
        assert.isTrue( t.isJsNumber(1), "1");
        assert.isTrue(t.isJsNumber(NaN), "NaN");
        assert.isTrue(t.isJsNumber(Infinity), "Infinity");
    },
    isNumeric: function () {
        assert.isFalse(t.isNumeric(Ctor), "Ctor");
        assert.isFalse(t.isNumeric(new Ctor()), "new Ctor()");
        assert.isFalse(t.isNumeric({}), "{}");
        assert.isFalse(t.isNumeric([]), "[]");
        assert.isFalse(t.isNumeric(arguments), "arguments");
        assert.isFalse(t.isNumeric(null), "null");
        assert.isFalse(t.isNumeric(undefined), "undefined");
        assert.isFalse(t.isNumeric(true), "true");
        assert.isTrue( t.isNumeric("1"), '"1"');
        assert.isTrue( t.isNumeric(1), "1");
        assert.isFalse(t.isNumeric(NaN), "NaN");
        assert.isFalse(t.isNumeric(Infinity), "Infinity");
    },
    isFinite: function () {
        assert.isFalse(t.isFinite(Ctor), "Ctor");
        assert.isFalse(t.isFinite(new Ctor()), "new Ctor()");
        assert.isFalse(t.isFinite({}), "{}");
        assert.isFalse(t.isFinite([]), "[]");
        assert.isFalse(t.isFinite(arguments), "arguments");
        assert.isFalse(t.isFinite(null), "null");
        assert.isFalse(t.isFinite(undefined), "undefined");
        assert.isFalse(t.isFinite(true), "true");
        assert.isTrue( t.isFinite("1"), '"1"');
        assert.isTrue( t.isFinite(1), "1");
        assert.isFalse(t.isFinite(NaN), "NaN");
        assert.isFalse(t.isFinite(Infinity), "Infinity");
    },
    isJsFinite: function () {
        assert.isTrue(t.isJsFinite(Ctor) === isFinite(Ctor), "Ctor");
        assert.isTrue(t.isJsFinite(new Ctor()) === isFinite(new Ctor()), "new Ctor()");
        assert.isTrue(t.isJsFinite({}) === isFinite({}), "{}");
        assert.isTrue(t.isJsFinite([]) === isFinite([]) , "[]");
        assert.isTrue(t.isJsFinite(arguments) === isFinite(arguments), "arguments");
        assert.isTrue(t.isJsFinite(null) === isFinite(null), "null");
        assert.isTrue(t.isJsFinite(undefined) === isFinite(undefined), "undefined");
        assert.isTrue(t.isJsFinite(false), "false");
        assert.isTrue(t.isJsFinite("1") === isFinite("1"), '"1"');
        assert.isTrue(t.isJsFinite(1) === isFinite(1), "1");
        assert.isTrue(t.isJsFinite(NaN) === isFinite(NaN), "NaN");
        assert.isTrue(t.isJsFinite(Infinity) === isFinite(Infinity), "Infinity");
    },
    isNull: function () {
        assert.isFalse(t.isNull(Ctor), "Ctor");
        assert.isFalse(t.isNull(new Ctor()), "new Ctor()");
        assert.isFalse(t.isNull({}), "{}");
        assert.isFalse(t.isNull([]), "[]");
        assert.isFalse(t.isNull(arguments), "arguments");
        assert.isTrue( t.isNull(null), "null");
        assert.isFalse(t.isNull(undefined), "undefined");
        assert.isFalse(t.isNull(true), "true");
        assert.isFalse(t.isNull("1"), '"1"');
        assert.isFalse(t.isNull(1), "1");
        assert.isFalse(t.isNull(NaN), "NaN");
        assert.isFalse(t.isNull(Infinity), "Infinity");
    },
    isDefined: function () {
        assert.isTrue( t.isDefined(Ctor), "Ctor");
        assert.isTrue( t.isDefined(new Ctor()), "new Ctor()");
        assert.isTrue( t.isDefined({}), "{}");
        assert.isTrue( t.isDefined([]), "[]");
        assert.isTrue( t.isDefined(arguments), "arguments");
        assert.isTrue( t.isDefined(false), "false");
        assert.isTrue( t.isDefined(null), "null");
        assert.isFalse(t.isDefined(undefined), "undefined");
        assert.isTrue( t.isDefined("1"), '"1"');
        assert.isTrue( t.isDefined(1), "1");
        // Some arg not being a number may be "undefined".
        // So we expect false for isDefined(NaN).
        assert.isFalse(t.isDefined(NaN), "NaN");
        assert.isFalse(t.isDefined(Infinity), "Infinity");
    },
    isInitialized: function () {
        assert.isTrue( t.isInitialized(Ctor), "Ctor");
        assert.isTrue( t.isInitialized(new Ctor()), "new Ctor()");
        assert.isTrue( t.isInitialized({}), "{}");
        assert.isTrue( t.isInitialized([]), "[]");
        assert.isTrue( t.isInitialized(arguments), "arguments");
        assert.isFalse(t.isInitialized(null), "null");
        assert.isFalse(t.isInitialized(undefined), "undefined");
        assert.isTrue( t.isInitialized(false), "false");
        assert.isTrue( t.isInitialized("1"), '"1"');
        assert.isTrue( t.isInitialized(1), "1");
        assert.isFalse(t.isInitialized(NaN), "NaN");
        assert.isFalse(t.isInitialized(Infinity), "Infinity");
    }
});
