export declare interface IStore<T> {
    exists(id: number|string): boolean;
    get(id: number|string): T;
    put(item:T): T;
    remove(item:T|string|number): boolean;
}

export declare interface IAsyncStore<T> {
    exists(id: number|string): Promise<boolean>;
    get(id: number|string): Promise<T>;
    put(item:T): Promise<T>;
    remove(item:T|string|number): Promise<boolean>;
}
