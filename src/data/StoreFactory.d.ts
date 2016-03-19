import {IStore} from "./IStore.d"

/**
 * A StoreFactory knows which kind of store to create for a particular
 * data type.
 */
export declare interface StoreFactory {

    getStore<T>(TypeCtor: {new(): T;}): IStore;
}
