export default function(opts?) {
	return function(targetProto, name) {
		if (!targetProto.$schema || typeof targetProto.$schema !== 'object') {
			targetProto.$schema = {}
		}
		if (!targetProto.$schema[name]) {
			targetProto.$schema[name] = {}
		}
		if (opts === false) {
			targetProto.$schema[name].scenario = "NONE";
			return;
		} else if (opts.scenario !== undefined) {
			targetProto.$schema[name].scenario = opts.scenario;
		}
		if (opts.plain !== undefined) {
			targetProto.$schema[name].plain = opts.plain;
		}
		if (typeof opts.parser === 'function' || typeof opts.parser === 'string') {
			targetProto.$schema[name].parser = opts.parser;
		}
		if (typeof opts.formatter === 'function' || typeof opts.formatter === 'string') {
			targetProto.$schema[name].formatter = opts.formatter;
		}
	};
}
