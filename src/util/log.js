/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @description
 * The logger module can be imported as AMD loader plug-in.
 * The parameter to pass to the loader plug-in is the ID of the module
 * for which to log. This ID is prepended to each log message like so:
 *
 * ```
 * define([
 *    "util/logger!myModule"
 * ], function(log) {
 *    log.error("My error message.") // will print: 'myModule: My error message.'
 * });
 * ```
 * @module util/log
 */
define(["pure/config"], function(config) {

    //var logDisabled = !(!!config.logging);
    var loglevels = {
            "none":  0,
            "error": 1,
            "warn":  2,
            "info":  3,
            "debug": 4,
            "all":   5
        },
        loglevel = loglevels[config.loglevel];
    function print(type, msg, args) {
        if (console && console[type]) {
            args = Array.prototype.slice.call(args);
            args.shift(); // remove msg; see getLogger()
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

    function getLogger(sourceId) {
        sourceId = sourceId ? sourceId + ": " : "";
        var noOp = function() {};
        return /** @lends module:util/log.prototype */ {
            /**
             * @method
             * @param {string} message
             */
            error: loglevel < loglevels.error ? noOp : function(msg) {
                print("error", sourceId + msg, arguments);
            },
            /**
             * @method
             * @param {string} message
             */
            warn: loglevel < loglevels.warn ? noOp :function(msg) {
                print("warn", sourceId + msg, arguments);
            },
            /**
             * @method
             * @param {string} message
             */
            info:  loglevel < loglevels.info ? noOp :function(msg) {
                print("info", sourceId + msg, arguments);
            },
            /**
             * @method
             * @param {string} message
             */
            debug:  loglevel < loglevels.debug ? noOp :function(msg) {
                print("debug", sourceId + msg, arguments);
            },
            /**
             * @method
             * @param {string} message
             */
            trace:  loglevel < loglevels.debug ? noOp :function(msg) {
                print("debug", sourceId + msg, arguments);
                print("trace", sourceId + "", arguments);
            }
        };
    }

    logger = getLogger();
    logger.load = function (sourceId, req, load, config) {
        load(getLogger(sourceId));
    };
    return logger;
});
