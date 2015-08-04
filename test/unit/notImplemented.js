/*global define*/
define([
    "intern!object",
    "intern/chai!assert",
    "my/module"
], function(registerSuite, assert, myModule) {
    "use strict";

    registerSuite({
        name: "my/module",
        test: function () {
            throw new Error("Not yet implemented.");
        }
    });
});
