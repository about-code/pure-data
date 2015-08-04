/*global define*/
/**
* @license MIT License (http://opensource.org/licenses/MIT)
* @copyright Copyright (c) 2015 devpunk.
*
* @constructor data/Observable
*/
define([
	"dojo/_base/declare",
	"rxjs"
], function(declare, Rx) {
	"use strict";

	var Subject = Rx.Subject;

	function closeRxStream(stream) {
        var completed, disposed;
        if (stream) {
            completed = stream.onCompleted && stream.onCompleted();
            disposed  = stream.dispose     && stream.dispose();
        }
    }

	var Ctor = declare([], /** @lends data/Observable.prototype */ {

		_listeners: null,

		constructor: function () {
			this._changesStream = null;
		},

		/**
		 * Returns a stream of ES7-compatible change records where each stream
		 * item represents a change to some observable object.
		 *
		 * @return RxJS Subject representing a stream of es7 change records.
		 * See also [RxJS](https://www.github.com/reactive-extensions/rxjs).
		 */
		changes: function() {
			if (this._changesStream === null) {
				this._changesStream = new Subject([]);
			}
			return this._changesStream;
		},

		/**
		 * Only meant to be used by Subclasses or Mixin-Targets. Writes
		 * change records to the changes stream.
		 * @protected
		 * @param {Array<object>} Array with `Object.observe` compatible change
		 * records.
		 * @see https://github.com/arv/ecmascript-object-observe
		 */
		notifyChanged: function(changeRecords) {
			var i, len;
			if (this._changesStream !== null) {
				for (i = 0, len = changeRecords.length; i < len; i += 1) {
					this._changesStream.onNext(changeRecords[i]);
					if (this.constructor.prototype._changesStream) {
						this.constructor.prototype._changesStream.onNext(changeRecords[i]);
					}
				}
			}
		},

		destroy: function () {
			closeRxStream(this._changesStream);
		}
	});

	return Ctor;
});
