//A window object which will be associated with the stack of windows
exports.AppMainWin = function(args) {
	
	var instance = Ti.UI.createWindow(args);
	var GeoData = require('/lib/GeoData');
	
var currentLocationLabel = Titanium.UI.createLabel({
	text:'Current Location (One Shot)',
	font:{fontSize:12, fontWeight:'bold'},
	color:'#111',
	top:110,
	left:10,
	height:15,
	width:300
});
instance.add(currentLocationLabel);

var currentLocation = Titanium.UI.createLabel({
	text:'Current Location not fired',
	font:{fontSize:11},
	color:'#444',
	top:130,
	left:10,
	height:15,
	width:300
});
instance.add(currentLocation);

var updatedLocationLabel = Titanium.UI.createLabel({
	text:'Updated Location',
	font:{fontSize:12, fontWeight:'bold'},
	color:'#111',
	top:150,
	left:10,
	height:15,
	width:300
});
instance.add(updatedLocationLabel);

var updatedLocation = Titanium.UI.createLabel({
	text:'Updated Location not fired',
	font:{fontSize:11},
	color:'#444',
	top:170,
	left:10,
	height:15,
	width:300
});
instance.add(updatedLocation);

var updatedLatitude = Titanium.UI.createLabel({
	text:'',
	font:{fontSize:11},
	color:'#444',
	top:190,
	left:10,
	height:15,
	width:300
});
instance.add(updatedLatitude);

var updatedLocationAccuracy = Titanium.UI.createLabel({
	text:'',
	font:{fontSize:11},
	color:'#444',
	top:210,
	left:10,
	height:15,
	width:300
});
instance.add(updatedLocationAccuracy);

var updatedLocationTime = Titanium.UI.createLabel({
	text:'',
	font:{fontSize:11},
	color:'#444',
	top:230,
	left:10,
	height:15,
	width:300
});
instance.add(updatedLocationTime);

	
	var button = Titanium.UI.createButton({
		title: 'Start',
		top: 10,
		width: 100,
		height: 50
	});
	
	function translateErrorCode(code) {
	
		if (code == null)
			return null;
		
		switch (code) {
			case Ti.Geolocation.ERROR_LOCATION_UNKNOWN:
				return "Location unknown";
			case Ti.Geolocation.ERROR_DENIED:
				return "Access denied";
			case Ti.Geolocation.ERROR_NETWORK:
				return "Network error";
			case Ti.Geolocation.ERROR_HEADING_FAILURE:
				return "Failure to detect heading";
			case Ti.Geolocation.ERROR_REGION_MONITORING_DENIED:
				return "Region monitoring access denied";
			case Ti.Geolocation.ERROR_REGION_MONITORING_FAILURE:
				return "Region monitoring access failure";
			case Ti.Geolocation.ERROR_REGION_MONITORING_DELAYED:
				return "Region monitoring setup delayed";
		}
	};
	
	button.addEventListener('click', function(e) {
		
		Ti.API.log("Clicked start button");
		
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
			currentLocation.text = 'long:' + geo.longitude + ' lat: ' + geo.latitude;
			Titanium.API.info('geo - current location: long ' + geo.longitude + ' lat ' + geo.latitude + ' accuracy ' + geo.accuracy);

		});
		
		Ti.Geolocation.addEventListener('location', function(e) {
			
			
			if (!e.success || e.error)
			{
				updatedLocation.text = 'error:' + JSON.stringify(e.error);
				updatedLatitude.text = '';
				updatedLocationAccuracy.text = '';
				updatedLocationTime.text = '';
				Ti.API.info("Code translation: "+translateErrorCode(e.code));
				return;
			}
			
			var geo = new GeoData(e.coords);
			globals.poi.push(geo);
			
			updatedLocation.text = 'long:' + geo.longitude;
			updatedLatitude.text = 'lat: '+ geo.latitude;
			updatedLocationAccuracy.text = 'accuracy:' + geo.accuracy;
			updatedLocationTime.text = 'timestamp:' +new Date(geo.timestamp);

			updatedLatitude.color = 'red';
			updatedLocation.color = 'red';
			updatedLocationAccuracy.color = 'red';
			updatedLocationTime.color = 'red';
			
			setTimeout(function()
			{
				updatedLatitude.color = '#444';
				updatedLocation.color = '#444';
				updatedLocationAccuracy.color = '#444';
				updatedLocationTime.color = '#444';

			},100);
			
			// Titanium.API.info('geo - location updated: ' + new Date(geo.timestamp) + ' long ' + geo.longitude + ' lat ' + geo.latitude + ' accuracy ' + geo.accuracy);
			
		});
		
	});
		
	instance.add(button);

	return instance;
};