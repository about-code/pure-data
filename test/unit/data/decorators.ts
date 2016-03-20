/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 Andrew Martin.
 */
 import * as registerSuite from "intern!object";
 import * as assert from "intern/chai!assert";
 import {Metadata} from "pure/data/Metadata";
 import {datatype, field} from "pure/data/decorators";

 registerSuite({
 	name: "data/decorators",
    test_datatype_empty: function () {

        @datatype("MyClass")
        class MyClass {}
        var myInstance = new MyClass();
        assert.strictEqual(Metadata.aboutClassOf(myInstance).getClassName(), "MyClass");
    }
});
