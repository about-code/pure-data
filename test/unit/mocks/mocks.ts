import {StoreFactory} from "./StoreFactory";
import {Inject} from "pure/di/Inject";
export * from "./StoreFactory";
export * from "./MemoryStore";

Inject.configure({
    "data/StoreFactory": {
        "default": {
            Ctor: StoreFactory,
            singleton: true
        }
    }
});
