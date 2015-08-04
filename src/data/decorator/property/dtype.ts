export default function(dtype:string) {
	return function(targetProto, name) {
		if (!targetProto.$schema || typeof targetProto.$schema !== 'object') {
			targetProto.$schema = {}
		}
		if (!targetProto.$schema[name]) {
			targetProto.$schema[name] = {}
		}
		if (dtype) {
			targetProto.$schema[name].dtype = dtype;
		}
	}
}
