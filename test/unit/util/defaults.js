/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */
define([
    "intern!object",
    "intern/chai!assert",
    "pure/util/defaults"
], function(registerSuite, assert, defaults) {
    "use strict";

    var expected = {
        prop1: "prop1",
        prop2: {
            prop21: "prop21"
        },
        prop3: function(given) {
            var valid = ["valid1", "valid2"];
            return valid.indexOf(given) >= 0 ? given : "prop3";
        }
    };

    registerSuite({
        name: "util/defaults",
        givenNothingExpected: function () {
            var given = {},
                result = defaults(given, expected);

            assert.equal(result.prop1, "prop1", "Missing 'prop1' in 'given' was not initialized with 'default'");
            assert.equal(result.prop2.prop21, "prop21", "Missing 'prop2' in 'given' was not initialized with 'default' object.");
            assert.equal(result.prop3, "prop3", "Validator/Initializer function in 'default' was not applied on 'given'");
        },
        givenSomeExpected: function() {
            var given = {
                    prop1: "prop1-given",
                },
                result = defaults(given, expected);

            assert.equal(result.prop1, "prop1-given", "Precedence error. Property from 'given' takes precedence but was overwritten by 'defaults()'.");
            assert.equal(result.prop2.prop21, "prop21");
            assert.equal(result.prop3, "prop3");
        },
        givenMoreThanExpected: function() {
            var given = {
                    propA: "no-default-specified",
                },
                result = defaults(given, expected);

            assert.equal(result.prop1, "prop1");
            assert.equal(result.prop2.prop21, "prop21");
            assert.equal(result.prop3, "prop3");
            assert.equal(result.propA, "no-default-specified", "Property from 'given' without a 'default' got lost.");
        },
        givenInvalid: function() {
            var given = {
                    prop3: "not valid."
                },
                result = defaults(given, expected);
            assert.equal(result.prop3, "prop3", "Invalid value in 'given' was not replaced by 'default'.");
        },
        givenValid: function() {
            var given = {
                    prop3: "valid1"
                },
                result = defaults(given, expected);
            assert.equal(result.prop3, "valid1", "Valid value in 'given' was replaced although it shouldn't.");
        },
        givenIsFunctionDefaultIsValue: function() {
            var given = {
                    prop1: function() {}
                },
                expected = {
                    prop1: "something"
                },
                result = defaults(given, expected);
            assert.isTrue(typeof result.prop1 === "function", "Functions in 'given' are not copied to 'result'.");
        },
        givenIsFunctionDefaultIsFunction: function() {
            var given = {
                    func: function() {}
                },
                expected = {
                    func: function(given) {return given;}
                },
                result = defaults(given, expected)

            assert.isTrue(result.func === given.func, "Problems when 'given' is a function and 'defaults' specifies a validator.");
        }
    });
});
