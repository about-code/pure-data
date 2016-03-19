/**
 * An interface to be used as the typing for object literals which represent a key-value map.
 */
export interface SimpleMap<V> {
    [key: string]:V;
};
