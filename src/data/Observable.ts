"use strict";
import {Subject} from "rxjs";
import {IObjectChangeRecord} from "./IObjectChangeRecord.d";
/**
 * @license MIT License (http://opensource.org/licenses/MIT)
 * @copyright Copyright (c) 2015 devpunk.
 */
export class Observable {

	_listeners = null;
    _changesStream = null;

	/**
	 * Returns a stream of change records where each stream item represents
	 * a change to some observable object.
	 * TODO: Describe interface for change records.
	 *
	 * @return RxJS Observable<IObjectChangeRecord> representing a stream of change records.
	 * See also [RxJS](https://www.github.com/reactive-extensions/rxjs).
	 */
	changes() {
		if (!this._changesStream) {
			this._changesStream = new Subject([]);
		}
		return this._changesStream.asObservable();
	}


    destroy() {
        this.closeRxStream(this._changesStream);
    }

	/**
	 * Only meant to be used by Subclasses or Mixin-Targets. Writes
	 * change records to the changes stream.
	 * @protected
	 * @param {Array<object>} Array of change records.
	 * @see https://github.com/arv/ecmascript-object-observe
	 */
	protected notifyChanged(changeRecords: Array<IObjectChangeRecord>) {
		var i, len;
		if (this._changesStream) {
			for (i = 0, len = changeRecords.length; i < len; i += 1) {
				this._changesStream.onNext(changeRecords[i]);
				if (this.constructor.prototype._changesStream) {
					this.constructor.prototype._changesStream.onNext(changeRecords[i]);
				}
			}
		}
	}

    protected closeRxStream(stream) {
        var completed, disposed;
        if (stream) {
            completed = stream.onCompleted && stream.onCompleted();
            disposed  = stream.dispose     && stream.dispose();
        }
    }
};
