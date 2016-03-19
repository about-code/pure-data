import {IStore, IAsyncStore} from "./IStore.d"

/**
 * A StoreFactory knows which kind of store to create for a particular
 * data type.
 */
export declare interface IStoreFactory {

    getStore<T>(TypeCtor: {new(): T;}): IStore;
    getAsyncStore<T>(TypeCtor: {new(): T;}): IAsyncStore;
}
