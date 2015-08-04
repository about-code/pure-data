define([], function() {

	/**
	 * @description Interface
	 * @constructor data/StoreAdapter
	 * @abstract
	 * @tutorial reading-data
	 */
	var StoreAdapter = function() {};

	/**
	 * Get entity data from a store or a remote location. The result is expected
	 * to be a plain javascript object structure of arbitrary depth but at most
	 * up to the depth of {@link data/Model#SERIALIZE_DEPTH_MAXIMUM|SERIALIZE_DEPTH_MAXIMUM}.
	 * @method data/StoreAdapter#fetch
	 * @abstract
	 * @param {function} EntityTypeCtor The entity type to fetch
	 * @param {string|number} id The entity id to fetch
	 * @return {Promise<object>} ES6-compatible promise for plain object entity data.
	 */
	StoreAdapter.prototype.fetch = function(EntityTypeCtor, id) {
		return new Promise(function(resolve, reject) {
			resolve("Congratulations. You've fetched data using the" +
			    " No-Such-Store-Adapter. Now continue with implementing the" +
				" adapter interface for your favourite store.");
		});
	};

	return StoreAdapter;
});
