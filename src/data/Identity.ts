import {type} from "../util/type";

/**
 * Helper function to read the ID from an object or array of objects.
 *
 * @param  {object|array} value
 * @return {string|number|array} An array if `value` is an array,
 * a primitive otherwise.
 */
export function ID(value) {
    if (type.isObject(value))  {
        return value[ID_PROPERTY(value)];
    } else if (type.isArray(value)) {
        var id, i = 0, iLen = value.length, result = [];
        for (i = 0; i < iLen; i += 1) {
            id = value[i][ID_PROPERTY(value[i])];
            result[i] = id;
        }

        /* When serializing an object(-tree), then on the maximum serialization
         * depth, entities shall merely be rendered to their ID. If on that level,
         * an entity references a collection of other entities, then ID() is
         * expected to return an array of IDs in order to preserve the
         * association. Though, when the collection is empty, we do not know
         * if it is really empty or if it is empty because the client has simply
         * not yet loaded any items. If we produce JSON like
         * {...
         *    myObj: {
         *       "id": "xy",
         *       "myCollection": []
         *    }
         * ...
         * }
         * in a PUT-scenario then a server could interpret this as to UPDATE
         * `myCollection` to an empty list, which in turn could mean to DELETE
         * all items in `myCollection` if there exist any serverside.
         *
         * To avoid such side effects we have decided, that when we approach
         * the maximum serialization depth, then an empty entity collection
         * is serialized to NULL rather than to an empty array. This way the
         * server can interpret NULL as NO UPDATE on "myCollection".
         */
        return result.length > 0 ? result : null;
    } else {
        return value;
    }
}

export function ID_PROPERTY(value) {
    if (!value) {
        return "id";
    } else if (type.isObject(value)) {
        var meta = value._meta;
        return value.$idProperty || value.constructor.$idProperty || (meta && meta.$idProperty) || "id";
    } else if (type.isFunction(value)) {
        var meta = value.prototype._meta;
        return value.$idProperty || (meta && meta.$idProperty) || "id";
    }
}
