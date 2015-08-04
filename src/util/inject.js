/*global define*/
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @description
 * A small module to realize rudimentary dependency injection.
 *
 * #### Injection Target:
 * If we want to write our own module which gets dependencies injected we
 * just need to require [inject](./inject.html).
 *  ```javascript
 * // Target module 'myTarget.js'
 * define(["util/inject!myTarget"], function(inject) {
 *    return {
 *       injected: inject({id: "myDependencyId", interface: "some/module/Interface"});
 *    }
 * })
 *```
 * Our *myTarget* module expects having some dependency injected which implements
 * the interface "some/module/Interface". The `interface` option is optional and
 * no more than a hint on what is expected. A unique *dependency identifier*
 * is used to refer to the *injection configuration*. What we see from the above
 * example is, that we used the AMD-Loader-Plug-in syntax for getting the *inject*
 * module. While the plug-in syntax is optional, you and your library users will
 * benefit later from being able to get a list of all injection targets
 * and the respective dependency identifiers they ask for. For example, the
 * above snippnet lets us run the following commands in the console:
 * ```
 * var inject = require("util/inject");
 * inject.listTargets();
 * // Output:
 * // {
 * //    "myTarget": {
 * //        "myDependencyId": "some/module/Interface"
 * //    },
 * //    "data/EntityManager": {
 * //        "data/storeAdapter": "data/StoreAdapter"
 * //    }
 * // }
 * ```
 * ... hey you've just discovered another injection target.
 *
 * #### Configuration:
 *
 * ```javascript
 * // injectConf.js
 * define(["util/inject","my/Class"], function(inject, MyClassCtor) {
 *     inject.configure({
 *         "myDependencyId": {
 *             Ctor: MyClassCtor,
 *             singleton: true
 *         }
 *     });
 * });
 * ```
 * We configured *myDependencyId* to deliver an instance of class `my/Class` whose
 * constructor was supplied via the `Ctor` property. When an injection target
 * requests the dependency then an instance is created using the constructor. In
 * the above example, the `singleton` option will cause, that the constructor
 * is invoked just once and any injection target will receive the same instance.
 * Instead of using `Ctor` we can also configure a factory using the `factory`
 * option. It expects a function which returns the value to inject into targets.
 * Again, configuring `singleton: true` will cause the factory result to be
 * cached and passed to every injection target whereas `singleton: false` will
 * evaluate the factory function for each target individually.
 *
 * #### AMD Loader Configuration
 * When using an AMD loader like [RequireJS](http://www.requirejs.org) you might
 * adjust you're loader config such that the inject module as well as the
 * injection configuration are `deps`.
 * ```
 * var requireConfig = {
 *    ...
 *    deps: ["injectConf"]
 * }
 * ```
 * **A note on AMD loaders vs. Dependency Injection**: Many people confuse AMD
 * loaders with a dependency injection utility. While they certainly provide some
 * form of dependency injection, in the end, their granularity and focus is on
 * modules while the focus of a DI utility should be on classes and interfaces.
 * For example, if you ever concatenated and minified your "one-module-per-class"
 * modules into a single file (AMD layer) you may found that your client's aren't
 * very much able to inject anything anymore unless you explicitely cared for. The inject
 * module aims at providing you with a utility so that you can "explicitely care
 * for" without having to write boilerplate code on your own.
 *
 * @module util/inject
 */
define([
	"dojo/_base/lang",
	"./log!util/inject",
], function(lang, log) {
	"use strict";

	/**
	 *  config = {
	 *      "depId" : {
	 *      	Ctor: function() {},          // +
	 *      	factory: function() {},       // | mutually exclusive
	 *      	value: null,                  // +
	 *      	singleton: true
	 *      }
	 *  };
	 */
	var config = {},
		inject;

	inject = function (dependency) {
		var dependencyId = dependency.id;
		if (! dependencyId) {
			throw new Error('No dependency id specified. Expecting format {id: ... [, interface: ...]}');
		}
		if (config.hasOwnProperty(dependencyId)) {
			var dep = config[dependencyId];
			if (dep.value) {
				// VALUE
				if (typeof dep.value === "object") {
					if (dep.singleton) {
						return dep.value;
					} else {
						return lang.clone(dep.value);
					}
				} else {
					return dep.value;
				}
			} else if (typeof dep.Ctor === "function") {
				// CONSTRUCTOR
				if (dep.singleton) {
					dep.value = new Ctor(); // next time we run into if(dep.value){...}
				}
				return dep.value;
			} else if (typeof dep.factory === "function") {
				// FACTORY
				if (dep.singleton) {
					dep.value = dep.factory.call();
					return dep.value;
				} else {
					return dep.factory.call();
				}
			}
		} else {
			log.debug('Dependency "' + dependencyId + '": Nothing to inject.');
		}
	};

	/**
	 * ```
	 * // Example: Set complete config
	 * inject.configure({
	 *    "myDependencyId": {
	 *        value: {someObj: 'data'},
	 *        singleton: false
	 *    },{
	 *       ...
	 *    }
     * });
	 *
	 * // Example: Configure a particular dependency
	 * inject.configure("myDependencyId", {
	 *    value: {someObj: 'data'},
	 *    singleton: false
	 * });
	 * ```
	 * @param {string|object} arg1
	 * @param {object} [arg2 = undefined]
	 */
	inject.configure = function(arg1, arg2) {
		if (arguments.length === 1) {
			config = arguments[0] || {};
		} else {
			config[arguments[0]] = arguments[1];
		}
	};

	/**
	 * Gives an overview about injection targets, the dependency identifiers
	 * they use to ask for a dependency injection and the interface they expect
	 * to be implemented by the injected component.
	 *
	 * For the list to be complete, injection targets should always require
	 * util/inject via AMD loader plug-in notation, e.g.
	 *
	 * //myTargetModule.js
	 * define([src/util/inject!myTargetModule], function(inject) {
	 *     return {
	 *         injected: inject("myTargetModule/myDependency", "myInterface")
	 *     }
     * });
	 */
	inject.listTargets = function() {
		return inject.targets;
	};

	inject.targets = {};

	/**
	 * Use the inject loader plug-in notation if you want to maintain a list of
	 * injection targets and the dependencies that can be configured for them.
	 */
	inject.load = function (sourceId, req, load, config) {
		var contextInject = function(dependency) {
			var dependencyId = dependency.id,
				interfaceModuleId = dependency.interface,
				result;

			result = inject(dependency);
			if (! inject.targets[sourceId]) {
				inject.targets[sourceId] = {};
			}
			inject.targets[sourceId][dependencyId] = interfaceModuleId || "No interface defined.";
			return result;
		};
        load(contextInject);
    };

	return inject;
});
