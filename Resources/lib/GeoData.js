// Set up object for Geodata
exports.GeoData = function(obj) {
	
	// TODO validate data before firing event
	
	var geodata = {};
	
	// Populate and validate geodata
	geodata.longitude = obj.longitude,
	geodata.latitude = obj.latitude,
	geodata.altitude = obj.altitude,
	geodata.heading = obj.heading,
	geodata.accuracy = obj.accuracy,
	geodata.speed = obj.speed,
	geodata.timestamp = obj.timestamp,
	geodata.altitudeAccuracy = obj.altitudeAccuracy

	Ti.API.fireEvent('createdgeodata', {data: geodata});

	return geodata;

}
