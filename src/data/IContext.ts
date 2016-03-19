
/**
 * Implementations of [[IContext]] are factories for instances
 * of a given type as well as scopes for these instances in which
 * the following holds true: given the premise that instance data
 * passed to the factory method [[IContext.create]] allows to infer
 * an instance identifier proper implementations of [[IContext]] guarantee
 * that they don't create two instances of the same type with the same
 * identifier. Implementations may create multiple instances of the
 * same type but with different identifiers or multiple instances with
 * the same identifier but of different type. The pair (type, identifier)
 * is called an objects *identity*.
 *
 * Given that the premise can not be met or an objects identity is incomplete,
 * implementations of [[IContext]] may create *anonymous* instances of
 * a data type. The data type itself is responsible to attach its instances
 * to an instance of [[IContext]] as soon as their identifier is set, if
 * its instances can't or shall not exist outside of a context.
 *
 * @see [[Identity]]
 */
export declare interface IContext {

    /**
     * Creates a new instance of type `DataTypeCtor` and sets/adds
     * an OwnProperty `instance.$context` where the value of `$context`
     * is a reference to this context.
     */
    create<T>(DataTypeCtor:{new():T;}, data?):T;

    /**
     * If the given instance is part of another context (its `$context`
     * property references another context) then attaching `instance`
     * implies that it is detached first, and then attached to this
     * context.
     * - Pre-Condition:  `instance` is an object
     * - Post-Condition: `instance.$context` points to this context).
     */
    attach<T>(instance:T):boolean;


    lookup(objOrType:Object|Function, id?:number|string);

    /**
     * If the given instance is part of another context (its `$context`
     * property references another context), then it must not be detached
     * by this context.
     * - Pre-Condition:  `instance.$context` may not be initialized or may reference a context
     * - Post-Condition: `instance.$context` is null).
     */
    detach<T>(instance:T);
}
