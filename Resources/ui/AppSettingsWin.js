//A window object which will be associated with the stack of windows
exports.AppSettingsWin = function(args) {
	
	var instance = Ti.UI.createWindow(args);
	
	var label = Ti.UI.createLabel({
		text: "App settings window"
	});

	Ti.API.log("App settings window");

	instance.add(label);	

	return instance;
}