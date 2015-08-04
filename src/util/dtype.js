/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk
 *
 * @module util/dtype
 * @augments module:util/type
 */
define([
	"dojo/_base/lang",
	"./type"
], function(lang, type) {
	return lang.mixin(type, /** @lends module:util/dtype.prototype */{

		/**
		 * @param {function} Ctor The type `arg` may or may not be an instance of
		 * @param {any} arg The argument to test for being an instance of `Ctor`
		 * @return {boolean} *true* if `arg` is an instance of `Ctor`, *false* otherwise
		 */
		isInstanceOf: function(Ctor, arg)  {
			return this.isObjectlike(arg) && this.isFunction(arg.isInstanceOf) && arg.isInstanceOf(Ctor);
		}
	});
});
