declare enum RecordType {
    update,
    splice
}
export declare interface IObjectChangeRecord extends IUpdateRecord, ISpliceRecord {
    /**
     * A string indicating the kind of change.
     */
    type:RecordType;

    /**
     * The object which changed. If `type === "update"` holds *true* then the change
     * record describes a change to an object property. `object` refers to the object
     * whose property changed. The change record further has properties from interface
     * *IPropertyUpdateRecord*.
     *
     * If `type === "splice"` holds *true* then the change record describes a
     * modification to an array. `object` refers to the array which changed. The change
     * record further has  properties from interface *IArraySpliceRecord*.
     */
    object: Object;
}
interface IUpdateRecord {
    name?: string;
    oldValue?: any;
}

interface ISpliceRecord {
    index?: number;
    addedCount?: number;
    removed?: Array<any>;
}
