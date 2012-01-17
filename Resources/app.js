// add a "require" function to the global scope (global object) which is smarter
// http://en.wikipedia.org/wiki/Monkey_patch ;)
require('lib/require_patch').monkeypatch(this);

//add a single variable to the global scope to which we may choose to
//intentionally add items to
var globals = {};
var AppActiveWin = require('ui/AppActiveWin');

//create a private scope to prevent further polluting the global object
(function() {
	
	// Init window modules to avoid multiple contexts
	var AppTabGroup = require('ui/AppTabGroup'),
		AppMainWin = require('ui/AppMainWin'),
		AppChallengesWin = require('ui/AppChallengesWin'),
		AppSettingsWin = require('ui/AppSettingsWin');
		

	//create our global tab group	
	globals.tabs = new AppTabGroup(
		{
			title: 'Main window',
			icon: 'KS_nav_views.png',
			window: new AppMainWin({
				title:'Main window',
				backgroundColor:'white'
			})
		},
		{
			title: 'Challenges',
			icon: 'KS_nav_views.png',
			window: new AppChallengesWin({
				title:'Challenges',
				backgroundColor:'white' 
			})
		},
		{
			title: 'App settings',
			icon: 'KS_nav_views.png',
			window: new AppSettingsWin({
				title:'App settings',
				backgroundColor:'white'
			})
		}
	);

	globals.tabs.open();
	
})();	