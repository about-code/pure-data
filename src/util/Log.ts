"use strict";
import {config} from "pure/config";

enum LogLevel {
    none = 0,
    error = 1,
    warn = 2,
    info = 3,
    debug= 4,
    all = 5
}
var loglevel:LogLevel = config.loglevel;

/**
 * Simple Logger
 *
 * ```typescript
 * import {Log} from "pure/util/util";
 *
 * var log = Logger.getLog("myModule");
 * log.warn("This is a warning.") // => "myModule: This is my warning."
 * ```
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 */
export class Log {

    private static print(type, msg, args) {
        if (console && console[type]) {
            switch(args.length) {
                case 0: console[type](msg); break;
                case 1: console[type](msg, args[0]); break;
                case 2: console[type](msg, args[0], args[1]); break;
                case 3: console[type](msg, args[0], args[1], args[2]); break;
                case 4: console[type](msg, args[0], args[1], args[2], args[3]); break;
                case 5: console[type](msg, args[0], args[1], args[2], args[3], args[4]); break;
                default:
                    console[type](msg, args);
            }
        }
    }

    static getLogger(sourceId) {
        sourceId = sourceId ? sourceId + ": " : "";
        var noOp = function() { return; };
        return {
            /**
             * @method
             * @param {string} message
             */
            error: loglevel < LogLevel.error ? noOp : function(msg:string, ...args:any[]) {
                Log.print("error", sourceId + msg, args);
            },
            /**
             * @method
             * @param {string} message
             */
            warn: loglevel < LogLevel.warn ? noOp :function(msg:string, ...args:any[]) {
                Log.print("warn", sourceId + msg, args);
            },
            /**
             * @method
             * @param {string} message
             */
            info:  loglevel < LogLevel.info ? noOp :function(msg:string, ...args:any[]) {
                Log.print("info", sourceId + msg, args);
            },
            /**
             * @method
             * @param {string} message
             */
            debug:  loglevel < LogLevel.debug ? noOp :function(msg:string, ...args:any[]) {
                Log.print("debug", sourceId + msg, args);
            },
            /**
             * @method
             * @param {string} message
             */
            trace:  loglevel < LogLevel.debug ? noOp :function(msg:string, ...args:any[]) {
                Log.print("debug", sourceId + msg, args);
                Log.print("trace", sourceId + "", args);
            }
        };
    }
}
