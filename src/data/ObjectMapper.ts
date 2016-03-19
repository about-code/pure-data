import {Log, type, defaults} from "../util/util";
import {ID, ID_PROPERTY} from "./Identity";
import {Metadata} from "./Metadata";
import {Entity} from "./Entity";
import {EntitySet} from "../collection/collection";

var log = Log.getLogger("data/ObjectMapper");

export class ObjectMapper {

    /**
     * Maximum serialization depth to stop at. This is a safeguard
     * to avoid maximum call stack errors when serializing deep or recursive
     * object structures and should not be modified.
     * @const 25
     */
    static SERIALIZE_DEPTH_MAXIMUM:number = 25;

    /**
     * Creates a plain JavaScript object from a model instance. If `opts`
     * specifies an HTTP scenario, then it will be compared against each field's
     * `ignore` config. If they match or `ignore` is *true*, the field won't be
     * serialized. If there's no `ignore` config, the model field will be serialized.
     *
     * Example:
     * ```typescript
     * class MyModel {
     *       @field() fieldA = "always";
     *       @field({ignore: false}) fieldB = "always";
     *       @field({ignore: "POST,PUT,DELETE" }) fieldC = "read-only";
     *       @field({ignore: "GET"}) fieldD = "write-only";
     *       @field({ignore: true}) fieldE = "always ignore";
     * }
     * ```
     * Running `ObjectMapper.toPlainObject(new MyModel(), {scenario: "POST"});` will produce
     * ```javascript
     * {
     *     fieldA: "always",
     *     fieldB: "always",
     *     fieldD: "write-only"
     * }
     * ```
     */
    static toPlainObject(obj:Object, opts:{serializeDepth?: number, scenario?: string}) {
        // MAX_DEPTH: vital to prevent infinite loops in models with circular references.
        // There shouldn't be many real world use cases with object hierarchies
        // deeper than MAX_DEPTH. If stakeholders have diverging requirements
        // the value specified might be increased reasonably;
        // currentDepth initialized with -2 because we get
        //   -1 when entering _serialize initially (doing type selection, only)
        //    0 when type handler calls _serialize on each property/item on the
        //    first level
        var MAX_DEPTH = ObjectMapper.SERIALIZE_DEPTH_MAXIMUM,
            result = obj,
            currentDepth = 0,
            finalDepth = 0;

        function _serializeValue(v) {
            currentDepth += 1;
            var tmp = v;
            if (currentDepth > opts.serializeDepth) {
                finalDepth = currentDepth + 1;
            }
            if (type.isArray(v)) {
                tmp = _serializeArray(v);
            } else if (type.isObject(v)) {
                tmp = _serializeObject(v);
            }
            // else: v = function, undefined, NaN, Infinity, ...
            currentDepth -= 1;
            return tmp;
        }

        function _serializeArray(arr) {
            if (currentDepth > opts.serializeDepth) {
                return ID(arr); // returns array of IDs
            }
            var value, plain = [];
            for (var i = 0, iLen = arr.length; i < iLen; i += 1) {
                currentDepth -=1;
                plain[i] = _serializeValue(arr[i]);
                currentDepth +=1;
            }
            return plain;
        }

        function _serializeObject(obj) {
            if (currentDepth > opts.serializeDepth) { return ID(obj); }
            var plain = {},
                meta = null,
                field = null,
                f_name = "",
                f_alias = null,
                f_ignore:any = false,
                f_formatter = null,
                f_formatted = "",
                tmp = null;

            for (f_name in obj) {
                if (obj.hasOwnProperty(f_name) && (/_|\$/).test(f_name[0]) === false) {
                    meta = Metadata.aboutClassOf(obj);
                    if (meta && (field = meta.getField(f_name)) !== undefined) {
                        f_ignore = field.get("ignore");
                        if (f_ignore === true || (type.isString(f_ignore) && f_ignore.indexOf(opts.scenario) >= 0)) {
                            continue;
                        } else {
                            f_alias = field.get("alias");
                            f_formatter = field.get("formatter");
                            if (f_alias === "") {
                                continue;    // an empty alias is equivalent to "never (de-)serialize"
                            } else if (!f_alias) {
                                f_alias = f_name; // field name assumed to be a property name on the data obj, too.
                            }
                            if (type.isFunction(f_formatter)) {
                                // formatter field config is a function
                                f_formatted = f_formatter.call(obj, f_name, obj[f_name]);
                            } else if (type.isFunction(obj[f_formatter])) {
                                // formatter field config refers to a method on the entity
                                f_formatted = obj[f_formatter].call(obj, f_name, obj[f_name]);
                            } else if (field.hasFlag("FK")) {
                                // "FK" flag forces formatting to id.
                                plain[f_alias] = ID(obj[f_name]);
                                continue;
                            } else {
                                f_formatted = obj[f_name];
                            }
                            plain[f_alias] = _serializeValue(f_formatted);
                        }
                    } else {
                        plain[f_name] = _serializeValue(obj[f_name]);
                    }
                }
            }
            return plain;
        }

        opts = defaults(opts, {
            scenario: "",
            serializeDepth: function(given) {
                return given >= 0 && given <= MAX_DEPTH ? given : MAX_DEPTH;
            }
        });
        //forceSerializeAll = opts.scenario.indexOf("*") >= 0;
        result = _serializeValue(obj);
        if (finalDepth >= MAX_DEPTH) {
            log.warn("serialize(): Stopped after " + (finalDepth-1) + " cycles. Do you have circular references?");
        }
        return result;
    }

    /**
     * Maps property value `src[p]` onto `target[p]` using rules defined
     * for the property `P` of type `T`. The mapping of a data object onto
     * a javascript object created with a constructor T is called
     * *deserialization*.
     *
     * Deserialization may be a (controlled) recursive process if an instance
     * of T has complex fields.
     *
     * Example:
     * ```javascript
     *     @datatype("T")
     *     class T extends Model {
     *         @field({dtype: C}) p;
     *     }
     *     // Instance data
     *     src = {...
     *        "p": {
     *           "p_1": ... ,
     *           "p_2": ... ,
     *           "p_3": ... ,
     *        }
     *     }
     *     // Instantiation: deserialize src into an instance t of type T
     *     var em = new EntityManager();
     *     var target = em.create(T, src);
     * ```
     * Once the deserializer reaches src["p"] it will entail from the **@field**
     * metadata of T["p"] that src["p"] is to be instantiated as instance of C. So it
     * processes a statement similar to
     * ```javascript
     * t["p"] = manager.create(C, src["p"]);
     * ```
     * At this point it enters recursion by deserializing the complex property src["p"].
     * There is no maximum depth for deserialization, at the moment. The number of recursions
     * depends on the structure of the input data but also on its getFieldstic description.
     *
     * @param {Object} src
     * @param {Object} target
     * @param {Object} opts
     */
    static fromPlainObject(src, target, opts?:{scenario: string}) {
        var meta,
            field,
            fields,
            f_name,
            f_src_name,
            f_src_names,
            f_src_value,
            f_alias,
            f_type,
            f_ctor,
            f_ignore,
            f_parser,
            f_flags,
            i,
            iLen,
            j,
            jLen,
            tmp;

        if (!type.isObject(src) || !type.isObject(target)) {
            return target;
        }
        opts = defaults(opts, { scenario: "*" });

        f_src_names = Object.getOwnPropertyNames(src);
        for (i = 0, iLen = f_src_names.length; i < iLen; i += 1) {
            f_src_name = f_src_names[i];
            f_src_value = src[f_src_name];
            meta = Metadata.aboutClassOf(target);
            if (meta) {
                fields = meta.getFields();
                f_name = meta.getFieldNameByAlias(f_src_name) || f_src_name;
            }
            if (fields && fields.hasOwnProperty(f_name)) {
                // we've got mapping metadata from @field decorators
                // evaluate `ignore` setting
                field     = fields[f_name];
                f_ignore  = field.get("ignore") || false;
                if (f_ignore === true || (type.isString(f_ignore) && f_ignore.indexOf(opts.scenario) >= 0)) {
                    continue;
                }
                f_type      = field.get("type") || "any";
                f_parser    = field.get("parser");
                f_ctor      = field.get("dtype");

                // invoke `parser` setting
                if (type.isFunction(f_parser)) {
                    f_src_value = f_parser.call(target, f_src_value);
                } else if (type.isFunction(target[f_parser])) {
                    f_src_value = target[f_parser].call(target, f_src_value);
                }

                // coerce array from `type` setting
                if (f_type === "array" && !type.isArray(f_src_value)) {
                    log.warn("deserialize(): Field '" + f_name + "': plain value does not match type declared in schema. Coerced array from ", f_src_value);
                    f_src_value = [f_src_value];
                }

                // instantiate related objects from `dtype` setting
                if (type.isFunction(f_ctor)) {
                    if(!f_type || f_type === "any") {
                        if (type.isArray(f_src_value)) {
                            f_type = "array";
                        }
                    }
                    if (f_type !== "array") {
                        if (f_src_value && !type.isInstanceOf(Entity, f_src_value)) {
                            if (target.$context) {
                                f_src_value = target.$context.create(f_ctor, f_src_value); // [1]
                            } else {
                                f_src_value = new f_ctor(f_src_value);
                            }
                        }
                        // else: f_src_value is already an entity.
                    } else {
                        tmp = EntitySet.create(f_ctor, target.$context);
                        jLen = f_src_value.length;
                        for (j = 0; j < jLen; j += 1) {
                            tmp.add(f_src_value[j]);
                        }
                        f_src_value = tmp;
                    }
                }

                // eventually set value on target
                if (type.isDefined(f_src_value)) {
                    target[f_name] = f_src_value;
                }
            } else if (! (/_|\$/).test(f_src_name.charAt(0))) {
                // Copy simple properties, except those which start with `_` or `$`
                if (target[f_src_name] !== src[f_src_name]) {
                    target.set(f_src_name, f_src_value); // TODO: clone f_src_value?
                }
            }
        }
        return target;

        // Implementation notes:
        // [1] We instantiate a plain object using entityManager.create()
        // such that no two instances of the same entity type
        // (dtype) with the same Id will be created more than once.
        // Note that we can also instantiate non-entities this way.
        // If they aren't `identifiable` entityManager.create() just
        // invokes f_ctor with the new operator.
        // Be aware that in case of `f_ctor` referring to another
        // model constructor, instantiation of `f_ctor` results
        // in a nested (recursive) call to this method. The
        // depth up to which we recurse, depends on the data we
        // deserialize and the corresponding schema(s).

    }
}
