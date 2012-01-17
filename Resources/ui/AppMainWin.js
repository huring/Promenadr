//A window object which will be associated with the stack of windows
exports.AppMainWin = function(args) {
	
	var instance = Ti.UI.createWindow(args);
	
	var label = Ti.UI.createLabel({
		text: "App main window"
	});

	instance.add(label);	

	return instance;
};