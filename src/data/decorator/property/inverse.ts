export default function(inverseName:string) {
	return function(targetProto, name) {
		if (!targetProto.$schema || typeof targetProto.$schema !== 'object') {
			targetProto.$schema = {}
		}
		if (!targetProto.$schema[name]) {
			targetProto.$schema[name] = {}
		}
		if (inverseName) {
			targetProto.$schema[name].inverse = inverseName;
		}
	}
}
