// Tracking active window
exports.AppActiveWin = function(args) {
	
	var instance = Ti.UI.createWindow(args);
	
	var label = Ti.UI.createLabel({
		text: "Action window"
	});

	instance.add(label);	

	// Return window instance
	return instance;
}