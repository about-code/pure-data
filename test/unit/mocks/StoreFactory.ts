import {IStore} from "./IStore.d";
import {Metadata} from "pure/data/Metadata";
import {IStoreFactory} from "pure/data/IStoreFactory.d";
import {SimpleMap} from "pure/collection/collection";
import {MemoryStore} from "./MemoryStore";

/**
 * This is only a default and sample store implementation.
 * Applications may need to write their own Stores and StoreFactories.
 * For example, to load entities from a remote location they may need
 * to create and return REST stores for all or some entity types.
 */
export class StoreFactory implements IStoreFactory {

    private _stores:SimpleMap<IStore> = {};

    getStore(EntityTypeCtor): IStore {
        var meta = Metadata.aboutClassOf(EntityTypeCtor),
            typeName = meta ? meta.getClassName() : null;

        if (typeName) {
            if (!this._stores.hasOwnProperty(typeName)) {
                this._stores[typeName] = new MemoryStore();
            }
            return this._stores[typeName];
        }
    }
}
