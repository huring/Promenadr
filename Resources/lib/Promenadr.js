exports.Promenadr = function(obj) {
	
	var GeoData = require('/lib/GeoData');
	var _currentLocation = null;
	
	// Private functions
	
	/**
 	* Get current location from phone
 	*
 	* @returns {e} event: returns new GeoData with current coords
 	*/
	function _getCurrentLocation() {
		
		Ti.Geolocation.purpose = "Track user GPS data";
		// Ti.Geolocation.distanceFilter = 5;
		Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
		Ti.Geolocation.preferredProvider = "gps";

		Ti.Geolocation.getCurrentPosition(function(e) {

			if (!e.success || e.error) {
				Ti.API.info("Code translation: "+translateErrorCode(e.code));
				alert('error ' + JSON.stringify(e.error));
				return;
			};
			
			var geo = new GeoData(e.coords);

			Ti.API.info('speed ' + geo.speed);
			// currentLocation.text = 'long:' + geo.longitude + ' lat: ' + geo.latitude;
			// Titanium.API.info('geo - current location: long ' + geo.longitude + ' lat ' + geo.latitude + ' accuracy ' + geo.accuracy);

			Ti.API.fireEvent('promGetCurrentLocation', {data: geo});

		});
	}
	
	function _addGeodata(obj) {
		Ti.API.log('_addGeodata');
	}
	
	/**
 	* Stop tracking geodata
 	*
 	* @param {e} event: button click event
 	*/
	function _stopTrackingGeodata(e) {
		Ti.API.log('Stop tracking location data');	
		Ti.Geolocation.removeEventListener('location', function(e) {
			// TODO make sure event fires
			// TODO Save latest data
			// TODO Cleanup
			
			Ti.API.log('Location event removed');	
			Ti.API.fireEvent('promStopTrackingGeodata');
		});
	}
	
	// Public functions
	return {
		
		getCurrentLocation: function() {
			return _getCurrentLocation();	
		},
		
		addGeodata: function(obj) {
			return _addGeodata(obj);
		},
		
		stopTrackingGeodata: function(e) {
			return _stopTrackingGeodata(e);
		}
	}
	
}
