import {IStore} from "./IStore.d";

export class MemoryStore implements IStore {

    get(id: number|string): Promise<Object> {
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }
    put(item:Object): Promise<Object> {
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }
    remove(item:Object|string|number): Promise<Object> {
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }
}
