/*global define*/

"use strict";
import {Log} from "../util/util";
var log = Log.getLogger("util/inject");


/**
 * This class is a rudimentary DI container for dependency
 * injection. It uses string identifiers and conventions over
 * class constructor references to look up injection values.
 *
 * A dependent class queries the container using the
 * following idiom:
 *
 * *Example: Dependent class (injection target)*
 * ```typescript
 * class MyInjectionTarget {
 *   constructor() {
 *     var injected = Inject.byId({ lookup: "MyInterface", target: "MyInjectionTarget" });
 *   }
 * }
 * ```
 * It must always pass a *lookup key* and a *target identifier*.
 * The lookup key refers to the actual "thing" to inject whereas the
 * target identifier is used to look up how the thing is going to be
 * injected into a particular target module. When a *container query*
 * is performed, the container will attempt to find both keys in its
 * configuration. The lookup key *must* be available in the config, the
 * target identifier *may* be available. If the container can't find
 * the target identifier configuration will look for a `"default"`
 * configuration which *must* be available. Hence the minimal injection
 * configuration for the consumer above looks like:
 *
 * *Example: Minimal container configuration*
 * ```typescript
 * Inject.configure {
 *   "MyInterface": {
 *     "default": {
 *       Ctor: MyService,
 *       singleton: true,
 *     }
 *   }
 * }
 * ```
 * If injection needs to be customized for a special target you can
 * provide a target configuration:
 *
 * *Example: Special configuration for target "MyInjectionTarget"*
 * ```typescript
 * Inject.configure {
 *   "MyInterface": {
 *     "MyInjectionTarget": {
 *       Ctor: MySpecialService
 *       singleton: false
 *     },
 *     "default": {
 *       Ctor: MyService,
 *       singleton: true,
 *     }
 *   }
 * }
 * ```
 * In the previous example we provided class constructors and let the
 * container instantiate `MyService` upon request. Alternatively we can
 * specify a `factory` to gain a bit more control about instantiation:
 *
 * *Example: Using a factory*
 * ```typescript
 * Inject.configure {
 *  "MyInterface": {
 *    "default": {
 *       factory: function() {
 *         return new MyService();
 *       },
 *       singleton: true
 *     }
 *   }
 * }
 * ```
 * A factory returns the value to inject into targets. Configuring
 * `singleton: true` will cause the factory result to be cached and
 * passed to every injection target whereas `singleton: false` will
 * evaluate the factory function for each target individually (note
 * that it will be evaluated more than once if a target invokes
 * `byId()` more than once).
 *
 * Simple values can be injected using the `value` config:
 *
 * *Example: Injecting simple values*
 * ```typescript
 * Inject.configure {
 *   "lookupKey": {
 *     "default": {
 *       value: "Some String",
 *       singleton: true
 *     },
 *   }
 * }
 * ```
 * We can use `singleton` with values, too. If it is *false* the container
 * will use `JSON.parse(JSON.stringify(value))` to create a deep clone for
 * each injection target.
 *
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 */
export class Inject {

    private static _config = null;

    /**
     * Configures the application-wide DI container configuration.
     * This method can only be called once. Use `reconfigure` to
     * overwrite the existing configuration.
     * @see [[Inject]]
     */
    static configure(config: Object) {
        if (Inject._config !== null) {
            throw new Error("The injection container can only be configured once. Use 'Inject.reconfigure({...})' to overwrite the existing configuration. Use the result of 'Inject.reconfigure()' to keep a reference to the existing config before overwriting it.");
        }
 		Inject._config = config;
    };

    /**
     * Overwrites the current injection configuration. Returns a
     * reference to configuration which will be overwritten to
     * allow for restoring it later using `reconfigure()` again.
     */
    static reconfigure(config: Object) {
        var oldConfig = Inject._config;
        Inject._config = config;
        return oldConfig;
    }

    /**
     * @see [[Inject]]
     */
    static byId(query: {lookup:string, target:string}) {
    	var config = Inject._config,
            lookupKey = query.lookup,
            targetId = query.target,
            targets = null,
            targetConf = null;

        if (!config) {
            throw new Error("Injection container has not been configured yet. Use Inject.configure({...}) before excuting code which expects dependencies to be injected.");
        }

    	if (lookupKey && config[lookupKey]) {
    		targets = config[lookupKey];
            targetConf = targets[targetId] || targets.default || {};
    		if (targetConf.value) {
    			// VALUE
    			if (typeof targetConf.value === "object") {
    				if (targetConf.singleton) {
    					return targetConf.value;
    				} else {
    					return JSON.parse(JSON.stringify(targetConf.value)); // deep clone
    				}
    			} else {
    				return targetConf.value;
    			}
    		} else if (typeof targetConf.Ctor === "function") {
    			// CONSTRUCTOR
    			if (targetConf.singleton) {
    				targetConf.value = new targetConf.Ctor(); // next time we run into if(targetConf.value){...}
    			}
    			return targetConf.value;
    		} else if (typeof targetConf.factory === "function") {
    			// FACTORY
    			if (targetConf.singleton) {
    				targetConf.value = targetConf.factory.call();
    				return targetConf.value;
    			} else {
    				return targetConf.factory.call();
    			}
    		}
    	}
    	throw new Error(`Invalid or missing injection configuration for lookup key "${lookupKey}".`);
    }
}
