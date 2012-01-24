//A window object which will be associated with the stack of windows
exports.AppMapWin = function(args) {
	
	Ti.include('/lib/Geo.js');
	Ti.include('/lib/sampleGeoData.js');
	var instance = Ti.UI.createWindow(args);
	var GeoData = require('/lib/GeoData');
	var distance = 0;
	var currentPos = null;
	var prevPos = null;
	
	var mapview = Titanium.Map.createView({
    	mapType: Titanium.Map.STANDARD_TYPE,
    	region: {latitude:65.5877886244642, longitude:22.146472288640666, latitudeDelta:0.01, longitudeDelta:0.01},
    	animate: true,
    	regionFit: true,
    	userLocation: true,
    	annotations: points
	});
	
	Ti.API.addEventListener('createdgeodata', function(e) {
		
		// Ti.API.log('Geodata item created');
		// Ti.API.log("Lat: " + e.data.latitude + " & lng: " + e.data.longitude); 
		
		var point = Titanium.Map.createAnnotation({
    		latitude: e.data.latitude,
    		longitude: e.data.longitude,
    		title:"Custom point",
    		pincolor:Titanium.Map.ANNOTATION_RED,
    		animate:true,
		});
		
		mapview.addAnnotation(point);
		
	});

	var points = [];

	/*
	for (var i = sampleGeoData.points.length - 1; i >= 0; i--){
	 	
	 	currentPos = new LatLon(sampleGeoData.points[i].lat, sampleGeoData.points[i].lng);
		
		var point = Titanium.Map.createAnnotation({
    		latitude: sampleGeoData.points[i].lat,
    		longitude: sampleGeoData.points[i].lng,
    		title:"Custom point",
    		pincolor:Titanium.Map.ANNOTATION_RED,
    		animate:true,
    		leftButton: '../images/appcelerator_small.png',
    		myid: i
		});
		
		if (prevPos != null) {
			distance += (prevPos.distanceTo(currentPos) * 1000);
		}
		
		prevPos = new LatLon(sampleGeoData.points[i].lat, sampleGeoData.points[i].lng);
		
		points.push(point);
	
	};
	*/

	instance.add(mapview);
	Ti.API.log("Total distance: " + Math.floor(distance) + " meters");
	return instance;
};