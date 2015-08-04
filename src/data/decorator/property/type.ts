export default function(type:string) {
	return function(targetProto, name) {
		if (!targetProto.$schema || typeof targetProto.$schema !== 'object') {
			targetProto.$schema = {}
		}
		if (!targetProto.$schema[name]) {
			targetProto.$schema[name] = {}
		}
		targetProto.$schema[name].type = type || "any";
	}
}
