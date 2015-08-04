export default function(propertyDef?) {
	return function(targetProto, name) {
		if (!targetProto.$schema || typeof targetProto.$schema !== 'object') {
			targetProto.$schema = {}
		}
		if (!targetProto.$schema[name]) {
			targetProto.$schema[name] = {}
		}
		if (propertyDef) {
			targetProto.$schema[name] = propertyDef;
		} else {
			targetProto.$schema[name] = {default: targetProto[name]};
		}
	};
}
