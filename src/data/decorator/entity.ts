export default function(value:string) {
	return function(target) {
		target.prototype.$name = value;
	}
}
