//A window object which will be associated with the stack of windows
exports.AppSettingsWin = function(args) {
	
	var instance = Ti.UI.createWindow(args);
	
	var label = Ti.UI.createLabel({
		text: "App settings window"
	});


	instance.add(label);	

	// Return window instance
	return instance;
};