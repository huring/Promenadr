/**
 * WARNING: this is generated code and will be lost if changes are made.
 * This generated source code is Copyright (c) 2010-2012 by Appcelerator, Inc. All Rights Reserved.
 */

var require={
	analytics: true,
	app: {
		copyright: "2012 by huring",
		description: "not specified",
		guid: "56559047-93c7-469a-977d-345fe7200ee2",
		id: "Promenadr",
		name: "Promenadr",
		publisher: "huring",
		url: "http://twitter.com/huring",
		version: "1.0"
	},
	deployType: "development",
	project: {
		id: "com.huring.promenadr",
		name: "Promenadr"
	},
	ti: {
		version: "1.8.0.1"
	},
	vendorPrefixes: {
		css: ["", "-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"],
		dom: ["", "Webkit", "Moz", "ms", "O", "Khtml"]
	}
};
/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 *
 * require.js
 * Copyright (c) 2010-2011, The Dojo Foundation
 * New BSD License / MIT License
 * <http://requirejs.org>
 * 
 * curl.js
 * Copyright (c) 2011 unscriptable.com / John Hann
 * MIT License
 * <https://github.com/unscriptable/curl>
 */

(function (global) {

	"use strict";

	var // misc variables
		x,
		odp,
		doc = global.document,
		el = doc.createElement("div"),

		// cached useful regexes
		commentRegExp = /(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg,
		cjsRequireRegExp = /[^.]require\(\s*["']([^'"\s]+)["']\s*\)/g,
		reservedModuleIdsRegExp = /exports|module/,

		// the global config settings
		cfg = global.require || {},

		// shortened packagePaths variable
		pp = cfg.packagePaths || {},

		// the number of seconds to wait for a script to load before timing out
		waitSeconds = (cfg.waitSeconds || 7) * 1000,

		baseUrl = cfg.baseUrl || "./",

		// CommonJS paths
		paths = cfg.paths || {},

		// feature detection results initialize by pre-calculated tests
		hasCache = cfg.hasCache || {},

		// a queue of module definitions to evaluate once a module has loaded
		defQ = [],

		// map of module ids to functions containing an entire module, which could
		// include multiple defines. when a dependency is not defined, the loader
		// will check the cache to see if it exists first before fetching from the
		// server. this is used when the build system bundles modules into the
		// minified javascript files.
		defCache = {},

		// map of package names to package resource definitions
		packages = {},

		// map of module ids to module resource definitions that are being loaded and processed
		waiting = {},

		// map of module ids to module resource definitions
		modules = {},

		// mixin of common functions
		fnMixin;

	/******************************************************************************
	 * Utility functions
	 *****************************************************************************/

	function _mix(dest, src) {
		for (var p in src) {
			src.hasOwnProperty(p) && (dest[p] = src[p]);
		}
		return dest;
	}

	function mix(dest) {
		// summary:
		//		Copies properties by reference from a source object to a destination
		//		object, then returns the destination object. To be clear, this will
		//		modify the dest being passed in.
		var i = 1;
		dest || (dest = {});
		while (i < arguments.length) {
			_mix(dest, arguments[i++]);
		}
		return dest;
	}

	function each(a, fn) {
		// summary:
		//		Loops through each element of an array and passes it to a callback
		//		function.
		var i = 0,
			l = (a && a.length) || 0,
			args = Array.prototype.slice.call(arguments, 0);
		args.shift();
		while (i < l) {
			args[0] = a[i++];
			fn.apply(null, args);
		}
	}

	function is(it, type) {
		// summary:
		//		Tests if anything is a specific type.
		return ({}).toString.call(it).indexOf('[object ' + type) === 0;
	}

	function isEmpty(it) {
		// summary:
		//		Checks if an object is empty.
		var p;
		for (p in it) {
			break;
		}
		return !it || (!it.call && !p);
	}

	function evaluate(code, sandboxVariables, globally) {
		// summary:
		//		Evaluates code globally or in a sandbox.
		//
		// code: String
		//		The code to evaluate
		//
		// sandboxVariables: Object?
		//		When "globally" is false, an object of names => values to initialize in
		//		the sandbox. The variable names must NOT contain '-' characters.
		//
		// globally: Boolean?
		//		When true, evaluates the code in the global namespace, generally "window".
		//		If false, then it will evaluate the code in a sandbox.

		var i,
			vars = [],
			vals = [],
			r;

		if (globally) {
			r = global.eval(code);
		} else {
			for (i in sandboxVariables) {
				vars.push(i + "=__vars." + i);
				vals.push(i + ":" + i);
			}
			r = (new Function("__vars", (vars.length ? "var " + vars.join(',') + ";\n" : "") + code + "\n;return {" + vals.join(',') + "};"))(sandboxVariables);
		}

		// if the last line of a module is a console.*() call, Firebug for some reason
		// sometimes returns "_firebugIgnore" instead of undefined or null
		return r === "_firebugIgnore" ? null : r;
	}

	function compactPath(path) {
		var result = [],
			segment,
			lastSegment;
		path = path.replace(/\\/g, '/').split('/');
		while (path.length) {
			segment = path.shift();
			if (segment === ".." && result.length && lastSegment !== "..") {
				result.pop();
				lastSegment = result[result.length - 1];
			} else if (segment !== ".") {
				result.push(lastSegment = segment);
			}
		}
		return result.join("/");
	}

	/******************************************************************************
	 * has() feature detection
	 *****************************************************************************/

	function has(name) {
		// summary:
		//		Determines of a specific feature is supported.
		//
		// name: String
		//		The name of the test.
		//
		// returns: Boolean (truthy/falsey)
		//		Whether or not the feature has been detected.

		if (is(hasCache[name], "Function")) {
			hasCache[name] = hasCache[name](global, doc, el);
		}
		return hasCache[name];
	}

	has.add = function (name, test, now, force){
		// summary:
		//		Adds a feature test.
		//
		// name: String
		//		The name of the test.
		//
		// test: Function
		//		The function that tests for a feature.
		//
		// now: Boolean?
		//		If true, runs the test immediately.
		//
		// force: Boolean?
		//		If true, forces the test to override an existing test.

		if (hasCache[name] === undefined || force) {
			hasCache[name] = test;
		}
		return now && has(name);
	};

	/******************************************************************************
	 * Event handling
	 *****************************************************************************/

	function on(target, type, listener) {
		// summary:
		//		Connects a listener to an event on the specified target.

		if (type.call) {
			// event handler function
			return type.call(target, listener);
		}

		// TODO: fix touch events?

		target.addEventListener(type, listener, false);
		return function () {
			target.removeEventListener(type, listener, false);
		};
	}

	on.once = function (target, type, listener) {
		var h = on(target, type, function () {
			h && h(); // do the disconnect
			return listener.apply(this, arguments);
		});
		return h;
	};

	/******************************************************************************
	 * Configuration processing
	 *****************************************************************************/

	// make sure baseUrl ends with a slash
	if (!/\/$/.test(baseUrl)) {
		baseUrl += "/";
	}

	function configPackage(/*String|Object*/pkg, /*String?*/dir) {
		// summary:
		//		An internal helper function to configure a package and add it to the array
		//		of packages.
		//
		// pkg: String|Object
		//		The name of the package (if a string) or an object containing at a minimum
		//		the package's name, but possibly also the package's location and main
		//		source file
		//
		// dir: String?
		//		Optional. A base URL to prepend to the package location

		pkg = pkg.name ? pkg : { name: pkg };
		pkg.location = (/(^\/)|(\:)/.test(dir) ? dir : "") + (pkg.location || pkg.name);
		pkg.main = (pkg.main || "main").replace(/(^\.\/)|(\.js$)/, "");
		packages[pkg.name] = pkg;
	}

	// first init all packages from the config
	each(cfg.packages, configPackage);

	// second init all package paths and their packages from the config
	for (x in pp) {
		each(pp[x], configPackage, x + "/");
	}

	// run all feature detection tests
	for (x in cfg.has) {
		has.add(x, cfg.has[x], 0, true);
	}

	/******************************************************************************
	 * Module functionality
	 *****************************************************************************/

	function ResourceDef(name, refModule, deps, rawDef) {
		// summary:
		//		A resource definition that describes a file or module being loaded.
		//
		// description:
		//		A resource is anything that is "required" such as applications calling
		//		require() or a define() with dependencies.
		//
		//		This loader supports resources that define multiple modules, hence this
		//		object.
		//
		//		In addition, this object tracks the state of the resource (loaded,
		//		executed, etc) as well as loads a resource and executes the defintions.
		//
		// name: String
		//		The module id.
		//
		// deps: Array?
		//		An array of dependencies.
		//
		// rawDef: Object? | Function? | String?
		//		The object, function, or string that defines the resource.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.

		var match = name && name.match(/^(.+?)\!(.*)$/),
			isRelative = /^\./.test(name),
			exports = {},
			pkg = null,
			cjs,
			_t = this;

		// name could be:
		//  - a plugin		text!/some/file.html or include!/some/file.js
		//  - a module		some/module, ../some/module
		//  - a js file		/some/file.js
		//  - a url			http://www.google.com/

		_t.name = name;
		_t.deps = deps || [];
		_t.plugin = null;
		_t.callbacks = [];

		if (!match && (/(^\/)|(\:)|(\.js$)/.test(name) || (isRelative && !refModule))) {
			_t.url = name;
		} else {
			if (match) {
				_t.plugin = _t.deps.length;
				_t.pluginArgs = match[2];
				_t.pluginCfg = cfg[match[1]];
				_t.deps.push(match[1]);
			} else if (name) {
				name = _t.name = compactPath((isRelative ? refModule.name + "/../" : "") + name);

				if (/^\./.test(name)) {
					throw new Error("Irrational path \"" + name + "\"");
				}

				// TODO: if this is a package, then we need to transform the URL into the module's path
				// MUST set pkg to anything other than null, even if this module isn't in a package
				pkg = "";

				/(^\/)|(\:)/.test(name) || (name = baseUrl + name);

				_t.url = name + ".js";
			}
		}

		_t.pkg = pkg;
		_t.rawDef = rawDef;
		_t.loaded = !!rawDef;
		_t.refModule = refModule;

		// our scoped require()
		function scopedRequire() {
			var args = Array.prototype.slice.call(arguments, 0);
			args.length > 1 || (args[1] = 0);
			args[2] = _t;
			return req.apply(null, args);
		}
		scopedRequire.toUrl = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			_t.plugin === null && (args[1] = _t);
			return toUrl.apply(null, args);
		};
		mix(scopedRequire, fnMixin, {
			cache: req.cache
		});

		_t.cjs = {
			require: scopedRequire,
			exports: exports,
			module: {
				exports: exports
			}
		};
	}

	ResourceDef.prototype.load = function (sync, callback) {
		// summary:
		//		Retreives a remote script and inject it either by XHR (sync) or attaching
		//		a script tag to the DOM (async).
		//
		// sync: Boolean
		//		If true, uses XHR, otherwise uses a script tag.
		//
		// callback: Function?
		//		A function to call when sync is false and the script tag loads.

		var s,
			x,
			disconnector,
			_t = this,
			cached = defCache[_t.name],
			fireCallbacks = function () {
				each(_t.callbacks, function (c) { c(_t); });
			},
			onLoad = function (rawDef) {
				_t.loaded = 1;
				if (_t.rawDef = rawDef) {
					if (is(rawDef, "String")) {
						// if rawDef is a string, then it's either a cached string or xhr response
						if (/\.js$/.test(_t.url)) {
							rawDef = evaluate(rawDef, _t.cjs);
							_t.def = _t.rawDef = !isEmpty(rawDef.exports) ? rawDef.exports : (rawDef.module && !isEmpty(rawDef.module.exports) ? rawDef.module.exports : null);
							_t.def === null && (_t.rawDef = rawDef);
						} else {
							_t.def = rawDef;
							_t.executed = 1;
						}
					} else if (is(rawDef, "Function")) {
						// if rawDef is a function, then it's a cached module definition
						waiting[_t.name] = _t;
						rawDef();
					}
				}
				processDefQ(_t);
				fireCallbacks();
				return 1;
			};

		_t.sync = sync;
		callback && _t.callbacks.push(callback);

		// if we don't have a url, then I suppose we're loaded
		if (!_t.url) {
			_t.loaded = 1;
			fireCallbacks();
			return;
		}

		// if we're already waiting, then we can just return and our callback will be fired
		if (waiting[_t.name]) {
			return;
		}

		// if we're already loaded or the definition has been cached, then just return now
		if (_t.loaded || cached) {
			return onLoad(cached);
		}

		// mark this module as waiting to be loaded so that anonymous modules can be
		// identified
		waiting[_t.name] = _t;

		if (sync) {
			x = new XMLHttpRequest();
			x.open("GET", _t.url, false);
			x.send(null);

			if (x.status === 200) {
				return onLoad(x.responseText);
			} else {
				throw new Error("Failed to load module \"" + _t.name + "\": " + x.status);
			}
		} else {
			// insert the script tag, attach onload, wait
			x = _t.node = doc.createElement("script");
			x.type = "text/javascript";
			x.charset = "utf-8";
			x.async = true;

			disconnector = on(x, "load", function (e) {
				e = e || global.event;
				var node = e.target || e.srcElement;
				if (e.type === "load" || /complete|loaded/.test(node.readyState)) {
					disconnector();
					onLoad();
				}
			});

			// set the source url last
			x.src = _t.url;

			s = doc.getElementsByTagName("script")[0];
			s.parentNode.insertBefore(x, s);
		}
	};

	ResourceDef.prototype.execute = function (callback) {
		// summary:
		//		Executes the resource's rawDef which defines the module.
		//
		// callback: Function?
		//		A function to call after the module has been executed.

		var _t = this;

		if (_t.executed) {
			callback && callback();
			return;
		}

		// first need to make sure we have all the deps loaded
		fetch(_t.deps, function (deps) {
			var i,
				p,
				r = _t.rawDef,
				q = defQ.slice(0), // backup the defQ
				finish = function () {
					_t.executed = 1;
					callback && callback();
				};

			// need to wipe out the defQ
			defQ = [];

			// make sure we have ourself in the waiting queue
			//waiting[_t.name] = _t;

			_t.def = _t.def
				||	(r && (is(r, "String")
						? evaluate(r, _t.cjs)
						: is(r, "Function")
							? r.apply(null, deps)
							: is(r, "Object")
								? (function (obj, vars) {
										for (var i in vars){
											this[i] = vars[i];
										}
										return obj;
									}).call({}, r, _t.cjs)
								: null
						)
					)
				||	_t.cjs.exports;

			// we might have just executed code above that could have caused a couple
			// define()'s to queue up
			processDefQ(_t);

			// restore the defQ
			defQ = q;

			// if plugin is not null, then it's the index in the deps array of the plugin
			// to invoke
			if (_t.plugin !== null) {
				p = deps[_t.plugin];

				// the plugin's content is dynamic, so just remove from the module cache
				if (p.dynamic) {
					delete modules[_t.name];
				}

				// if the plugin has a load function, then invoke it!
				p.load && p.load(_t.pluginArgs, _t.cjs.require, function (v) {
					_t.def = v;
					finish();
				}, _t.pluginCfg);
			}

			finish();
		}, function (ex) {
			throw ex;
		}, _t.refModule, _t.sync);
	};

	function getResourceDef(name, refModule, deps, rawDef, dontCache) {
		// summary:
		//		Creates a new resource definition or returns an existing one from cache.

		var module = new ResourceDef(name, refModule, deps, rawDef);

		if (name in module.cjs) {
			module.def = module[name];
			module.loaded = module.executed = 1;
			return module;
		}

		return dontCache ? module : (module.name ? modules[module.name] || (modules[module.name] = module) : module);
	}

	function processDefQ(module) {
		// summary:
		//		Executes all modules sitting in the define queue.
		//
		// description:
		//		When a resource is loaded, the remote AMD resource is fetched, it's
		//		possible that one of the define() calls was anonymous, so it should
		//		be sitting in the defQ waiting to be executed.

		var m,
			q = defQ.slice(0);
		defQ = [];

		while (q.length) {
			m = q.shift();

			// if the module is anonymous, assume this module's name
			m.name || (m.name = module.name);

			// if the module is this module, then modify this 
			if (m.name === module.name) {
				modules[m.name] = module;
				module.deps = m.deps;
				module.rawDef = m.rawDef;
				module.execute();
			} else {
				modules[m.name] = m;
				m.execute();
			}
		}

		delete waiting[module.name];
	}

	function fetch(deps, success, failure, refModule, sync) {
		// summary:
		//		Fetches all dependents and fires callback when finished or on error.
		//
		// description:
		//		The fetch() function will fetch each of the dependents either
		//		synchronously or asynchronously (default).
		//
		// deps: String | Array
		//		A string or array of module ids to load. If deps is a string, load()
		//		returns the module's definition.
		//
		// success: Function?
		//		A callback function fired once the loader successfully loads and evaluates
		//		all dependent modules. The function is passed an ordered array of
		//		dependent module definitions.
		//
		// failure: Function?
		//		A callback function fired when the loader is unable to load a module. The
		//		function is passed the exception.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.
		//
		// sync: Boolean?
		//		Forces the async path to be sync.
		//
		// returns: Object | Function
		//		If deps is a string, then it returns the corresponding module definition,
		//		otherwise the require() function.

		var i, l, count, s = is(deps, "String");

		if (s) {
			deps = [deps];
			sync = 1;
		}

		for (i = 0, l = count = deps.length; i < l; i++) {
			deps[i] && (function (idx, name) {
				getResourceDef(deps[idx], refModule).load(!!sync, function (m) {
					m.execute(function () {
						deps[idx] = m.def;
						if (--count === 0) {
							success && success(deps);
							count = -1; // prevent success from being called the 2nd time below
						}
					});
				});
			}(i, deps[i]));
		}

		count === 0 && success && success(deps);
		return s ? deps[0] : deps;
	}

	function def(name, deps, rawDef) {
		// summary:
		//		Used to define a module and it's dependencies.
		//
		// description:
		//		Defines a module. If the module has any dependencies, the loader will
		//		resolve them before evaluating the module.
		//
		//		If any of the dependencies fail to load or the module definition causes
		//		an error, the entire definition is aborted.
		//
		// name: String|Array?
		//		Optional. The module name (if a string) or array of module IDs (if an array) of the module being defined.
		//
		// deps: Array?
		//		Optional. An array of module IDs that the rawDef being defined requires.
		//
		// rawDef: Object|Function
		//		An object or function that returns an object defining the module.
		//
		// example:
		//		Anonymous module, no deps, object definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the module definition
		//		is immediately defined.
		//
		//		|	define({
		//		|		sq: function (x) { return x * x; }
		//		|	});
		//
		// example:
		//		Anonymous module, no deps, rawDef definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define(function (require, exports, module) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Named module, no deps, object definition.
		//
		//		Since no deps, the module definition is immediately defined.
		//
		//		|	define("arithmetic", {
		//		|		sq: function (x) { return x * x; }
		//		|	});
		//
		// example:
		//		Named module, no deps, rawDef definition.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define("arithmetic", function (require, exports, module) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Anonymous module, two deps, object definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the loader will load the two
		//		dependencies, then once the dependencies are loaded, it will evaluate a
		//		function wrapper around the module definition.
		//
		//		|	define(["dep1", "dep2"], {
		//		|		sq: function (x) { return x * x; }
		//		|	});
		//
		// example:
		//		Anonymous module, two deps, function definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the loader will load the two
		//		dependencies, then once the dependencies are loaded, it will evaluate
		//		the rawDef function.
		//
		//		|	define(["dep1", "dep2"], function (dep1, dep2) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Name module, two deps, object definition.
		//
		//		After the two dependencies are loaded, the loader will evaluate a
		//		function wrapper around the module definition.
		//
		//		|	define("arithmetic", ["dep1", "dep2"], {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Name module, two deps, function definition.
		//
		//		After the two dependencies are loaded, the loader will evaluate the
		//		function rawDef.
		//
		//		|	define("arithmetic", ["dep1", "dep2"], function (dep1, dep2) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
		//		|		};
		//		|	});

		var i = ["require"],
			module;

		if (!rawDef) {
			rawDef = deps || name;
			rawDef.length === 1 || i.concat(["exports", "module"]);
			if (typeof name !== "string") {
				deps = deps ? name : i;
				name = 0;
			} else {
				deps = i;
			}
		}

		if (reservedModuleIdsRegExp.test(name)) {
			throw new Error("Not allowed to define reserved module id \"" + name + "\"");
		}

		if (is(rawDef, "Function") && arguments.length === 1) {
			// treat rawDef as CommonJS definition and scan for any requires and add
			// them to the dependencies so that they can be loaded and passed in.
			rawDef.toString()
				.replace(commentRegExp, "")
				.replace(cjsRequireRegExp, function (match, dep) {
					deps.push(dep);
				});
		}

		module = getResourceDef(name, 0, deps, rawDef);

		// if not waiting for this module to be loaded, then the define() call was
		// possibly inline or deferred, so try fulfill dependencies, and define the
		// module right now.
		if (name && !waiting[name]) {
			module.execute();

		// otherwise we are definitely waiting for a script to load, eventhough we
		// may not know the name, we'll know when the script's onload fires.
		} else if (name || !isEmpty(waiting)) {
			defQ.push(module);

		// finally, we we're ask to define something without a name and there's no
		// scripts pending, so there's no way to know what the name is. :(
		} else {
			throw new Error("Unable to define anonymous module");
		}
	}

	// set the "amd" property and advertise supported features
	def.amd = {
		plugins: true
	};

	function toUrl(name, refModule) {
		// summary:
		//		Converts a module name including extension to a URL path.
		//
		// name: String
		//		The module name including extension.
		//
		// returns: String
		//		The fully resolved URL.
		//
		// example:
		//		Returns the URL for a HTML template file.
		//		|	define(function (require) {
		//		|		var templatePath = require.toUrl("./templates/example.html");
		//		|	});

		var	match = name.match(/(.+)(\.[^\/\.]+?)$/),
			module = getResourceDef((match && match[1]) || name, refModule, 0, 0, 1),
			url = module.url;

		module.pkg !== null && (url = url.substring(0, url.length - 3));
		return url + ((match && match[2]) || "");
	}

	function req(deps, callback, refModule) {
		// summary:
		//		Fetches a module, caches its definition, and returns the module. If an
		//		array of modules is specified, then after all of them have been
		//		asynchronously loaded, an optional callback is fired.
		//
		// deps: String | Array
		//		A string or array of strings containing valid module identifiers.
		//
		// callback: Function?
		//		Optional. A function that is fired after all dependencies have been
		//		loaded. Only applicable if deps is an array.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.
		//
		// returns: Object | Function
		//		If calling with a string, it will return the corresponding module
		//		definition.
		//
		//		If calling with an array of dependencies and a callback function, the
		//		require() function returns itself.
		//
		// example:
		//		Synchronous call.
		//		|	require("arithmetic").sq(10); // returns 100
		//
		// example:
		//		Asynchronous call.
		//		|	require(["arithmetic", "convert"], function (arithmetic, convert) {
		//		|		convert(arithmetic.sq(10), "fahrenheit", "celsius"); // returns 37.777
		//		|	});

		return fetch(deps, function (deps) {
			callback && callback.apply(null, deps);
		}, function (ex) {
			throw ex;
		}, refModule) || req;
	}

	req.toUrl = toUrl;
	req.config = cfg;
	mix(req, fnMixin = {
		each: each,
		evaluate: evaluate,
		has: has,
		is: is,
		mix: mix,
		on: on
	});

	req.cache = function(subject) {
		// summary:
		//		Copies module definitions into the definition cache.
		//
		// description:
		//		When running a build, the build will call this function and pass in an
		//		object with module id => function. Each function contains the contents
		//		of the module's file.
		//
		//		When a module is required, the loader will first see if the module has
		//		already been defined.  If not, it will then check this cache and execute
		//		the module definition.  Modules not defined or cached will be fetched
		//		remotely.
		//
		// subject: String | Object
		//		When a string, returns the cached object or undefined otherwise an object
		//		with module id => function where each function wraps a module.
		//
		// example:
		//		This shows what build system would generate. You should not need to do this.
		//		|	require.cache({
		//		|		"arithmetic": function () {
		//		|			define(["dep1", "dep2"], function (dep1, dep2) {
		//		|				var api = { sq: function (x) { return x * x; } };
		//		|			});
		//		|		},
		//		|		"my/favorite": function () {
		//		|			define({
		//		|				color: "red",
		//		|				food: "pizza"
		//		|			});
		//		|		}
		//		|	});
		var p, m, re = /^url\:(.+)/;
		if (is(subject, "String")) {
			return defCache[subject];
		} else {
			for (p in subject) {
				m = p.match(re);
				if (m) {
					defCache[toUrl(m[1])] = subject[p];
				} else {
					m = getResourceDef(p, 0, 0, subject[p], 1);
					defCache[m.name] = m.rawDef;
				}
			}
		}
	};

	// expose require() and define() to the global namespace
	global.require = req;
	global.define = def;

}(window));

require.cache({
	"include": function () {
		define(function () {
			var cache = {},
				stack = [];

			return {
				dynamic: true, // prevent the loader from caching the result

				normalize: function (name, normalize) {
					var parts = name.split("!"),
						url = parts[0];
					parts.shift();
					return (/^\./.test(url) ? normalize(url) : url) + (parts.length ? "!" + parts.join("!") : "");
				},

				load: function (name, require, onLoad, config) {
					var c,
						x,
						parts = name.split("!"),
						len = parts.length,
						url,
						sandbox;

					if (sandbox = len > 1 && parts[0] === "sandbox") {
						parts.shift();
						name = parts.join("!");
					}

					url = require.toUrl(/^\//.test(name) ? name : "./" + name, stack.length ? { name: stack[stack.length-1] } : null);
					c = cache[url] || require.cache(url);

					if (!c) {
						x = new XMLHttpRequest();
						x.open("GET", url, false);
						x.send(null);
						if (x.status === 200) {
							c = x.responseText;
						} else {
							throw new Error("Failed to load include \"" + url + "\": " + x.status);
						}
					}

					stack.push(url);
					try {
						require.evaluate(cache[url] = c, 0, !sandbox);
					} catch (e) {
						throw e;
					} finally {
						stack.pop();
					}

					onLoad(c);
				}
			};
		});
	}
});/**
 * This file contains source code from the following:
 *
 * es5-shim
 * Copyright 2009, 2010 Kristopher Michael Kowal
 * MIT License
 * <https://github.com/kriskowal/es5-shim>
 */

(function(global){
	var cfg = require.config,
		is = require.is,
		each = require.is;

	// Object.defineProperty() shim
	if (!Object.defineProperty || !(function (obj) {
			try {
				Object.defineProperty(obj, "x", {});
				return obj.hasOwnProperty("x");
			} catch (e) { }
		}({}))) {
		// add support for Object.defineProperty() thanks to es5-shim
		Object.defineProperty = function defineProperty(obj, prop, desc) {
			if (!obj || (!is(obj, "Object") && !is(obj, "Function") && !is(obj, "Window"))) {
				throw new TypeError("Object.defineProperty called on non-object: " + obj);
			}
			desc = desc || {};
			if (!desc || (!is(desc, "Object") && !is(desc, "Function"))) {
				throw new TypeError("Property description must be an object: " + desc);
			}
	
			if (odp) {
				try {
					return odp.call(Object, obj, prop, desc);
				} catch (e) { }
			}
	
			var op = Object.prototype,
				h = function (o, p) {
					return o.hasOwnProperty(p);
				},
				a = h(op, "__defineGetter__"),
				p = obj.__proto__;
	
			if (h(desc, "value")) {
				if (a && (obj.__lookupGetter__(prop) || obj.__lookupSetter__(prop))) {
					obj.__proto__ = op;
					delete obj[prop];
					obj[prop] = desc.value;
					obj.__proto__ = p;
				} else {
					obj[prop] = desc.value;
				}
			} else {
				if (!a) {
					throw new TypeError("Getters and setters can not be defined on this javascript engine");
				}
				if (h(desc, "get")) {
					defineGetter(obj, prop, desc.get);
				}
				if (h(desc, "set")) {
					defineSetter(obj, prop, desc.set);
				} else {
					obj[prop] = null;
				}
			}
		};
	}

	// console.*() shim	
	typeof console !== "undefined" || (console = {});

	// make sure "log" is always at the end
	each(["debug", "info", "warn", "error", "log"], function (c) {
		console[c] || (console[c] = ("log" in console)
			?	function () {
					var a = Array.apply({}, arguments);
					a.unshift(c + ":");
					console.log(a.join(" "));
				}
			:	function () {}
		);
	});

	// JSON.parse() and JSON.stringify() shim
	if (typeof JSON === "undefined" || JSON.stringify({a:0}, function(k,v){return v||1;}) !== '{"a":1}') {
		function escapeString(s){
			return ('"' + s.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r");
		}
	
		JSON.parse = function (s) {
			return eval('(' + s + ')');
		};
	
		JSON.stringify = function (value, replacer, space) {
			var undef;
			if (is(replacer, "String")) {
				space = replacer;
				replacer = null;
			}
	
			function stringify(it, indent, key) {
				var val,
					len,
					objtype = typeof it,
					nextIndent = space ? (indent + space) : "",
					sep = space ? " " : "",
					newLine = space ? "\n" : "",
					ar = [];
	
				if (replacer) {
					it = replacer(key, it);
				}
				if (objtype === "number") {
					return isFinite(it) ? it + "" : "null";
				}
				if (is(objtype, "Boolean")) {
					return it + "";
				}
				if (it === null) {
					return "null";
				}
				if (is(it, "String")) {
					return escapeString(it);
				}
				if (objtype === "function" || objtype === "undefined") {
					return undef;
				}
	
				// short-circuit for objects that support "json" serialization
				// if they return "self" then just pass-through...
				if (is(it.toJSON, "Function")) {
					return stringify(it.toJSON(key), indent, key);
				}
				if (it instanceof Date) {
					return '"{FullYear}-{Month+}-{Date}T{Hours}:{Minutes}:{Seconds}Z"'.replace(/\{(\w+)(\+)?\}/g, function(t, prop, plus){
						var num = it["getUTC" + prop]() + (plus ? 1 : 0);
						return num < 10 ? "0" + num : num;
					});
				}
				if (it.valueOf() !== it) {
					return stringify(it.valueOf(), indent, key);
				}
	
				// array code path
				if (it instanceof Array) {
					for(key = 0, len = it.length; key < len; key++){
						var obj = it[key];
						val = stringify(obj, nextIndent, key);
						if (!is(val, "String")) {
							val = "null";
						}
						ar.push(newLine + nextIndent + val);
					}
					return "[" + ar.join(",") + newLine + indent + "]";
				}
	
				// generic object code path
				for (key in it) {
					var keyStr;
					if (is(key, "Number")) {
						keyStr = '"' + key + '"';
					} else if (is(key, "String")) {
						keyStr = escapeString(key);
					} else {
						continue;
					}
					val = stringify(it[key], nextIndent, key);
					if (!is(val, "String")) {
						// skip non-serializable values
						continue;
					}
					// At this point, the most non-IE browsers don't get in this branch 
					// (they have native JSON), so push is definitely the way to
					ar.push(newLine + nextIndent + keyStr + ":" + sep + val);
				}
				return "{" + ar.join(",") + newLine + indent + "}"; // String
			}
	
			return stringify(value, "", "");
		};
	}

	// print the Titanium version *after* the console shim
	console.info("[INFO] Appcelerator Titanium " + cfg.ti.version + " Mobile Web");

	// make sure we have some vendor prefixes defined
	cfg.vendorPrefixes || (cfg.vendorPrefixes = ["", "Moz", "Webkit", "O", "ms"]);

	var Ti = {};
	global.Ti = global.Titanium = Ti = {};

	Ti._5 = {};
	var loaded = false,
		loaders = [];

	// public function for onload notification
	global.onloaded = function(f){
		onload(f);
	};

	// private function
	function onload(f) {
		if (loaded) {
			f();
		} else {
			loaders.push(f);
		}
	}

	function beforeonload() {
		document.body.style.margin = "0";
		document.body.style.padding = "0";
		global.scrollTo(0, 1);
	}

	function afteronload() {
	}

	// TODO use DOMContentLoaded event instead
	global.onload = function() {
		loaded = true;
		beforeonload();
		for (var c=0 ; c < loaders.length; c++) {
			loaders[c]();
		}
		loaders = null;
		afteronload();
	};

	global.onbeforeunload = function() {
		Ti.App.fireEvent('close');
		Ti._5.addAnalyticsEvent('ti.end', 'ti.end');

	};

	// run onload
	Ti._5.run = function(app) {
		onload(app);
	};

	Ti._5.preset = function(obj, props, values){
		if(!values || !obj || !props){
			return;
		}

		for(var ii = 0; ii < props.length; ii++){
			var prop = props[ii];
			if(typeof values[prop] != 'undefined'){
				obj[prop] = values[prop];
			}
		}
	};

	Ti._5.presetUserDefinedElements = function(obj, args){
		for(var prop in args){
			if(typeof obj[prop] == 'undefined'){
				obj[prop] = args[prop];
			}
		}
	};
	
	Ti._5.prop = function(obj, property, value, descriptor) {
		if (require.is(property, "Object")) {
			for (var i in property) {
				Ti._5.prop(obj, i, property[i]);
			}
		} else {
			var skipSet,
				capitalizedName = property.substring(0, 1).toUpperCase() + property.substring(1);

			// if we only have 3 args, so need to check if it's a default value or a descriptor
			if (arguments.length === 3 && require.is(value, "Object") && (value.get || value.set)) {
				descriptor = value;
				// we don't have a default value, so skip the set
				skipSet = 1;
			}

			// if we have a descriptor, then defineProperty
			if (descriptor) {
				if ("value" in descriptor) {
					skipSet = 2;
					if (descriptor.get || descriptor.set) {
						// we have a value, but since there's a custom setter/getter, we can't have a value
						value = descriptor.value;
						delete descriptor.value;
						value !== undefined && (skipSet = 0);
					} else {
						descriptor.writable = true;
					}
				}
				descriptor.configurable = true;
				descriptor.enumerable = true;
				Object.defineProperty(obj, property, descriptor);
			}

			// create the get/set functions
			obj["get" + capitalizedName] = function(){ return obj[property]; };
			(skipSet | 0) < 2 && (obj["set" + capitalizedName] = function(val){ return obj[property] = val; });

			// if there's no default value or it's already been set with defineProperty(), then we skip setting it
			skipSet || (obj[property] = value);
		}
	};

	Ti._5.propReadOnly = function(obj, property, value) {
		var undef;
		if (require.is(property, "Object")) {
			for (var i in property) {
				Ti._5.propReadOnly(obj, i, property[i]);
			}
		} else {
			Ti._5.prop(obj, property, undef, require.is(value, "Function") ? { get: value, value: undef } : { value: value });
		}
	};

	Ti._5.createClass = function(className, value){
		var classes = className.split(".");
		var parent = window;
		for(var ii = 0; ii < classes.length; ii++){
			var klass = classes[ii];
			if(typeof parent[klass] == 'undefined'){
				parent[klass] = ii == classes.length - 1 && typeof value != 'undefined' ? value : new Object();
			}
			parent = parent[klass];
		}
		return parent;
	};

	// do some actions when framework is loaded
	Ti._5.frameworkLoaded = function() {
		if (cfg.analytics) {
			// enroll event
			if(localStorage.getItem("mobileweb_enrollSent") == null){
				// setup enroll event
				Ti._5.addAnalyticsEvent('ti.enroll', 'ti.enroll', {
					mac_addr: null,
					oscpu: null,
					app_name: cfg.appName,
					platform: Ti.Platform.name,
					app_id: cfg.appId,
					ostype: Ti.Platform.osname,
					osarch: Ti.Platform.architecture,
					model: Ti.Platform.model,
					deploytype: cfg.deployType
				});
				localStorage.setItem("mobileweb_enrollSent", true)
			}

			// app start event
			Ti._5.addAnalyticsEvent('ti.start', 'ti.start', {
				tz: (new Date()).getTimezoneOffset(),
				deploytype: cfg.deployType,
				os: Ti.Platform.osname,
				osver: Ti.Platform.ostype,
				version: cfg.tiVersion,
				un: null,
				app_version: cfg.appVersion,
				nettype: null
			});

			// try to sent previously sent analytics events on app load
			Ti._5.sendAnalytics();
		}

		Ti._5.containerDiv = document.createElement('div');
		Ti._5.containerDiv.style.width = "100%";
		Ti._5.containerDiv.style.height = "100%";
		Ti._5.containerDiv.style.overflow = "hidden";
		Ti._5.containerDiv.style.position = "absolute"; // Absolute so that any children that are absolute positioned will respect this DIVs height and width.
		document.body.appendChild(Ti._5.containerDiv);
	};

	Ti._5.getAbsolutePath = function(path){
		if(path.indexOf("app://") == 0){
			path = path.substring(6);
		}

		if(path.charAt(0) == "/"){
			path = path.substring(1);
		}

		if(path.indexOf("://") >= 0){
			return path;
		} else {
			return location.pathname.replace(/(.*)\/.*/, "$1") + "/" + path;
		}
	};

	Ti._5.px = function(val){
		return val + (typeof val == 'number' ? 'px' : '');
	};

	Ti._5.createUUID = function(){
		/*!
		Math.uuid.js (v1.4)
		http://www.broofa.com
		mailto:robert@broofa.com

		Copyright (c) 2010 Robert Kieffer
		Dual licensed under the MIT and GPL licenses.
		*/
		// RFC4122v4 solution:
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		}).toUpperCase();
	};

	Ti._5.getArguments = function(){
		return cfg;
	};

	var _sessionId = sessionStorage.getItem('mobileweb_sessionId');
	if(_sessionId == null){
		_sessionId = Ti._5.createUUID();
		sessionStorage.setItem('mobileweb_sessionId', _sessionId);
	}

	var ANALYTICS_STORAGE = "mobileweb_analyticsEvents";
	Ti._5.addAnalyticsEvent = function(eventType, eventEvent, data, isUrgent){
		if (!cfg.analytics) {
			return;
		}
		// store event
		var storage = localStorage.getItem(ANALYTICS_STORAGE);
		if(storage == null){
			storage = [];
		} else {
			storage = JSON.parse(storage);
		}
		var now = new Date();
		var ts = "yyyy-MM-dd'T'HH:mm:ss.SSSZ".replace(/\w+/g, function(str){
			switch(str){
				case "yyyy":
					return now.getFullYear();
				case "MM":
					return now.getMonth() + 1;
				case "dd":
					return now.getDate();
				case "HH":
					return now.getHours();
				case "mm":
					return now.getMinutes();
				case "ss":
					return now.getSeconds();
				case "SSSZ":
					var tz = now.getTimezoneOffset();
					var atz = Math.abs(tz);
					tz = (tz < 0 ? "-" : "+") + (atz < 100 ? "00" : (atz < 1000 ? "0" : "")) + atz;
					return now.getMilliseconds() + tz;
				default:
					return str;
			}
		});
		var formatZeros = function(v, n){
			var d = (v+'').length;
			return (d < n ? (new Array(++n - d)).join("0") : "") + v;
		};

		storage.push({
			eventId: Ti._5.createUUID(),
			eventType: eventType,
			eventEvent: eventEvent,
			eventTimestamp: ts,
			eventPayload: data
		});
		localStorage.setItem(ANALYTICS_STORAGE, JSON.stringify(storage));
		Ti._5.sendAnalytics(isUrgent);
	};

	var ANALYTICS_WAIT = 300000; // 5 minutes
	var _analyticsLastSent = null;
	var eventSeq = 1;

	// collect and send Ti.Analytics notifications
	Ti._5.sendAnalytics = function(isUrgent){
		if (!cfg.analytics) {
			return;
		}

		var i,
			evt,
			storage = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE)),
			now = (new Date()).getTime(),
			jsonStrs = [],
			ids = [],
			body = document.body,
			iframe,
			form,
			hidden,
			rand = Math.floor(Math.random() * 1e6),
			iframeName = "analytics" + rand,
			callback = "mobileweb_jsonp" + rand;

		if (storage == null || (!isUrgent && _analyticsLastSent !== null && now - _analyticsLastSent < ANALYTICS_WAIT)) {
			return;
		}

		for (i = 0; i < storage.length; i++) {
			evt = storage[i];
			ids.push(evt.eventId);
			jsonStrs.push(JSON.stringify({
				seq: eventSeq++,
				ver: "2",
				id: evt.eventId,
				type: evt.eventType,
				event: evt.eventEvent,
				ts: evt.eventTimestamp,
				mid: Ti.Platform.id,
				sid: _sessionId,
				aguid: cfg.guid,
				data: require.is(evt.eventPayload, "object") ? JSON.stringify(evt.eventPayload) : evt.eventPayload
			}));
		}

		function onIframeLoaded() {
			body.removeChild(form);
			body.removeChild(iframe);
		}

		iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.onload = onIframeLoaded;
		iframe.onerror = onIframeLoaded;
		iframe.id = iframe.name = iframeName;

		form = document.createElement("form");
		form.style.display = "none";
		form.target = iframeName;
		form.method = "POST";
		form.action = "https://api.appcelerator.net/p/v2/mobile-track?callback=" + callback;

		hidden = document.createElement("input");
		hidden.type = "hidden";
		hidden.name = "content";
		hidden.value = "[" + jsonStrs.join(",") + "]";

		body.appendChild(iframe);
		body.appendChild(form);
		form.appendChild(hidden);

		global[callback] = function(response){
			if(response && response.success){
				// remove sent events on successful sent
				var j, k, found,
					storage = localStorage.getItem(ANALYTICS_STORAGE),
					ev,
					evs = [];

				for(j = 0; j < storage.length; j++){
					ev = storage[j];
					found = 0;
					for (k = 0; k < ids.length; k++) {
						if (ev.eventId == ids[k]) {
							found = 1;
							ids.splice(k, 1);
							break;
						}
					}
					found || evs.push(ev);
				}

				localStorage.setItem(ANALYTICS_STORAGE, JSON.stringify(evs));
				
			}
		};
		form.submit();
	};

	Ti._5.extend = function(dest, source){
		for(var key in source){
			dest[key] = source[key];
		}

		return dest;
	};

	var _localeData = {};
	Ti._5.setLocaleData = function(obj){
		_localeData = obj;
	};
	Ti._5.getLocaleData = function(){
		return _localeData;
	};

	// Get browser window sizes
	Ti._5.getWindowSizes = function() {
		var winW = 630, winH = 460;
		if (document.body && document.body.offsetWidth) {
			winW = document.body.offsetWidth;
			winH = document.body.offsetHeight;
		}
		if (
			document.compatMode=='CSS1Compat' &&
			document.documentElement &&
			document.documentElement.offsetWidth
		) {
			winW = document.documentElement.offsetWidth;
			winH = document.documentElement.offsetHeight;
		}
		if (window.innerWidth && window.innerHeight) {
			winW = window.innerWidth;
			winH = window.innerHeight;
		}
		return {
			width: parseInt(winW),
			height: parseInt(winH)
		}
	};

	var _loadedScripts = {};
	Ti._5.getS = function(){
		return _loadedScripts;
	}
	Ti._5.setLoadedScripts = function(scripts){
		if(scripts == null){
			return;
		}

		for(var key in scripts){
			Ti._5.addLoadedScript(key, scripts[key]);
		}
	};

	Ti._5.addLoadedScript = function(path, content){
		path = Ti._5.getAbsolutePath(path);
		_loadedScripts[path] = content;
	};

	Ti._5.getLoadedScript = function(path){
		path = Ti._5.getAbsolutePath(path);
		return _loadedScripts[path];
	};

	Ti._5.execLoadedScript = function(path){
		var code = Ti._5.getLoadedScript(path);
		if(typeof code == 'undefined'){
			return;
		}

		var head = document.getElementsByTagName('head')[0];
		if(head == null){
			head = document;
		}
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.innerHTML = code;
		head.appendChild(script);
	};
}(window));(function(oParentNamespace) {

	var lastActive,
		isBack,
		screens = [];

	window.onpopstate = function(evt) {
		if(evt && evt.state && evt.state.screenIndex != null){
			var win = screens[evt.state.screenIndex];
			// for opening HTML windows
			if (win) {
				isBack = true;
				win.screen_open();
			}
		}
	};

	// Create object
	oParentNamespace.Screen = function(obj, args) {
		var idx = screens.length;
		screens.push(obj);

		obj.screen_open = function() {
			// there are active window, this is not the same window and current window is not window inside other window
			lastActive && lastActive !== obj && !obj.parent && lastActive.hide();
			lastActive = obj;

			// this is top level window - it has no parent - need to add it into DOM
			!obj.parent && Ti._5.containerDiv.appendChild(obj.dom);

			obj.show();

			if(isBack){
				isBack = false;
			} else {
				// leave record in History object
				window.history.pushState({ screenIndex: idx }, "", "");
			}
			obj.fireEvent('screen_open');
		};

		obj.screen_close = function() {
			obj.fireEvent('screen_close');
			Ti._5.containerDiv.removeChild(obj.dom);
			// go prev state
			window.history.go(-1);
		};
	};

})(Ti._5);
;
Ti._5.Interactable = function(obj, isNotSearch) {
	obj.addEventListener || oParentNamespace.EventDriven(obj);

	var on = require.on,
		domNode = obj.dom;

	function fire(eventName) {
		var v = domNode && domNode.value;
		obj.fireEvent(eventName, v !== undefined && { value: v });
	}

	on(domNode, "focus", function() {
		fire("focus");
	});

	on(domNode, "blur", function() {
		fire("blur");
	});

	function change() {
		fire("change");
	}

	on(domNode, "change", change);
	on(domNode, "input", change);
	on(domNode, "paste", change);

	isNotSearch || on(domNode, "keyup", function(evt) {
		!obj.suppressReturn && !evt.altKey && !evt.ctrlKey && evt.keyCode === 13 && fire("return");
	});
};
;
Ti._5.Clickable = function(obj) {
	obj.addEventListener || oParentNamespace.EventDriven(obj);

	require.on(obj.dom, "click", function(evt) {
		obj.fireEvent("click", {
			x: evt.pageX,
			y: evt.pageY
		});
	});

	require.on(obj.dom, "dblclick", function(evt) {
		obj.fireEvent("dblclick", {
			x: evt.pageX,
			y: evt.pageY
		});
	});
};
;
Ti._5.EventDriven = function(obj) {
	var listeners = null;

	obj.addEventListener = function(eventName, handler){
		listeners || (listeners = {});
		(listeners[eventName] = listeners[eventName] || []).push(handler);
	};

	obj.removeEventListener = function(eventName, handler){
		if (listeners) {
			if (handler) {
				var i = 0,
					events = listeners[eventName],
					l = events && events.length || 0;

				for (; i < l; i++) {
					events[i] === handler && events.splice(i, 1);
				}
			} else {
				delete listeners[eventName];
			}
		}
	};

	obj.hasListener = function(eventName) {
		return listeners && listeners[eventName];
	};

	obj.fireEvent = function(eventName, eventData){
		if (listeners) {
			var i = 0,
				events = listeners[eventName],
				l = events && events.length,
				data = require.mix({
					source: obj,
					type: eventName
				}, eventData);

			while (i < l) {
				events[i++].call(obj, data);
			}
		}
	};
};
;
Ti._5.Styleable = function(obj, args) {
	args = args || {};

	if (!obj.dom) {
		return;
	}

	var undef,
		on = require.on,
		domNode = obj.dom,
		domStyle = domNode.style,
		ui = Ti.UI,
		px = Ti._5.px,
		vendorPrefixes = require.config.vendorPrefixes,
		curRotation,
		curTransform,
		_backgroundColor,
		_backgroundImage,
		_backgroundFocusPrevColor,
		_backgroundFocusPrevImage,
		_backgroundSelectedPrevColor,
		_backgroundSelectedPrevImage,
		_gradient,
		_visible,
		_prevDisplay = "";

	domNode.className += " HTML5_Styleable";

	obj.addEventListener || oParentNamespace.EventDriven(obj);

	function cssUrl(url) {
		return /^url\(/.test(url) ? url : "url(" + Ti._5.getAbsolutePath(url) + ")";
	}

	function font(val) {
		val = val || {};
		require.each(["fontVariant", "fontStyle", "fontWeight", "fontSize", "fontFamily"], function(f) {
			val[f] = f in val ? domStyle[f] = (f === "fontSize" ? px(val[f]) : val[f]) : domStyle[f];
		});
		return val;
	}

	function unitize(x) {
		return isNaN(x-0) || x-0 != x ? x : x + "px"; // note: must be != and not !==
	}

	Ti._5.prop(obj, {
		backgroundColor: {
			// we keep the backgroundColor in a variable because we later change it
			// when focusing or selecting, so we can't just report the current value
			get: function() {
				return _backgroundColor || (_backgroundColor = domStyle.backgroundColor);
			},
			set: function(val) {
				domStyle.backgroundColor = _backgroundColor = val;
			}
		},
		backgroundFocusedColor: undef,
		backgroundFocusedImage: undef,
		backgroundGradient: {
			get: function() {
				return _gradient;
			},
			set: function(val) {
				var val = _gradient = val || {},
					output = [],
					colors = val.colors || [],
					type = val.type,
					start = val.startPoint,
					end = val.endPoint;

				if (type === "linear") {
					start && end && start.x != end.x && start.y != end.y && output.concat([
						unitize(val.startPoint.x) + " " + unitize(val.startPoint.y),
						unitize(val.endPoint.x) + " " + unitize(val.startPoint.y)
					]);
				} else if (type === "radial") {
					start = val.startRadius;
					end = val.endRadius;
					start && end && output.push(unitize(start) + " " + unitize(end));
					output.push("ellipse closest-side");
				} else {
					domStyle.backgroundImage = "none";
					return;
				}

				require.each(colors, function(c) {
					output.push(c.color ? c.color + " " + (c.position * 100) + "%" : c);
				});

				output = type + "-gradient(" + output.join(",") + ")";

				require.each(vendorPrefixes.css, function(p) {
					domStyle.backgroundImage = p + output;
				});
			}
		},
		backgroundImage: {
			// we keep the backgroundImage in a variable because we later change it
			// when focusing or selecting, so we can't just report the current value
			get: function() {
				return _backgroundImage = (_backgroundImage = domStyle.backgroundImage);
			},
			set: function(val) {
				domStyle.backgroundImage = _backgroundImage = val ? cssUrl(val) : "";
			}
		},
		backgroundSelectedColor: undef,
		backgroundSelectedImage: undef,
		borderColor: {
			get: function() {
				return domStyle.borderColor;
			},
			set: function(val) {
				if (domStyle.borderColor = val) {
					domStyle.borderWidth || (obj.borderWidth = 1);
					domStyle.borderStyle = "solid";
				} else {
					obj.borderWidth = 0;
				}
			}
		},
		borderRadius: {
			get: function() {
				return domStyle.borderRadius || "";
			},
			set: function(val) {
				domStyle.borderRadius = px(val);
			}
		},
		borderWidth: {
			get: function() {
				return domStyle.borderWidth;
			},
			set: function(val) {
				domStyle.borderWidth = val = px(val);
				domStyle.borderColor || (domStyle.borderColor = "black");
				domStyle.borderStyle = "solid";
			}
		},
		color: {
			get: function() {
				return domStyle.color;
			},
			set: function(val) {
				domStyle.color = val;
			}
		},
		focusable: undef,
		font: {
			get: function() {
				return font();
			},
			set: function(val) {
				font(val);
			}
		},
		opacity: {
			get: function() {
				return domStyle.opacity;
			},
			set: function(val) {
				domStyle.opacity = val;
			}
		},
		visible: {
			get: function() {
				return _visible;
			},
			set: function(val) {
				val ? obj.show() : obj.hide();
			}
		},
		zIndex: {
			get: function() {
				return domStyle.zIndex;
			},
			set: function(val) {
				val !== domStyle.zIndex && domStyle.position === "static" && (domStyle.position = "absolute");
				domStyle.zIndex = val;
			}
		}
	});

	on(domNode, "focus", function() {
		if (obj.focusable) {
			if (obj.backgroundSelectedColor) {
				_backgroundSelectedPrevColor || (_backgroundSelectedPrevColor = obj.backgroundColor);
				domStyle.backgroundColor = obj.backgroundSelectedColor;
			}

			if (obj.backgroundSelectedImage) {
				_backgroundSelectedPrevImage || (_backgroundSelectedPrevImage = obj.backgroundImage);
				domStyle.backgroundImage = cssUrl(obj.backgroundSelectedImage);
			}

			if (obj.backgroundFocusedColor) {
				_backgroundFocusPrevColor || (_backgroundFocusPrevColor = obj.backgroundFocusedColor);
				domStyle.backgroundColor = obj.backgroundFocusedColor;
			}

			if (obj.backgroundFocusedImage) {
				_backgroundFocusPrevImage || (_backgroundFocusPrevImage = obj.backgroundImage);
				domStyle.backgroundImage = cssUrl(obj.backgroundFocusedImage);
			}
		}
	});

	on(domNode, "blur", function() {
		if (obj.focusable) {
			if (_backgroundSelectedPrevColor) {
				domStyle.backgroundColor = _backgroundSelectedPrevColor;
				_backgroundSelectedPrevColor = 0;
			}

			if (_backgroundSelectedPrevImage) {
				domStyle.backgroundImage = cssUrl(_backgroundSelectedPrevImage);
				_backgroundSelectedPrevImage = 0;
			}

			if (_backgroundFocusPrevColor) {
				domStyle.backgroundColor = _backgroundFocusPrevColor;
				_backgroundFocusPrevColor = 0;
			}

			if (_backgroundFocusPrevImage) {
				domStyle.backgroundImage = cssUrl(_backgroundFocusPrevImage);
				_backgroundFocusPrevImage = 0;
			}
		}
	});

	//
	// API Methods
	//
	obj.add = function(view) {
		obj._children.push(view);
		view.parent = obj;
		obj.render();
	};

	obj.remove = function(view) {
		domNode && view.dom.parentNode && domNode.removeChild(view.dom);
		for (var i = 0; i < obj._children.length; i++) {
			view === obj._children[i] && obj._children.splice(i, 1);
		}
		obj.render();
	};

	obj.show = function() {
		domStyle.display = _prevDisplay || "";
		obj.fireEvent("html5_shown");
		return _visible = true;
	};

	// Fire event for all children
	obj.addEventListener("html5_shown", function() {
		require.each(obj._children, function(c) { c.fireEvent("html5_shown"); });
	});

	obj.hide = function() {
		if (domStyle.display !== "none") {
			_prevDisplay = domStyle.display;
			domStyle.display = "none";
		}
		obj.fireEvent("html5_hidden");
		return _visible = false;
	};

	// Fire event for all children
	obj.addEventListener("html5_hidden", function(){
		require.each(obj._children, function(c) { c.fireEvent("html5_hidden"); });
	});

	obj.css = function(rule, value) {
		var i = 0,
			r,
			vp = vendorPrefixes.dom,
			upperCaseRule = rule[0].toUpperCase() + rule.substring(1);

		for (; i < vp.length; i++) {
			r = vp[i];
			r += r ? upperCaseRule : rule;
			if (r in domStyle) {
				return value !== undefined ? domStyle[r] = value : domStyle[r];
			}
		}
	};

	obj.animate = function(anim, callback) {
		var curve = "ease",
			transform = "";

		switch (anim.curve) {
			case ui.ANIMATION_CURVE_LINEAR: curve = "linear"; break;
			case ui.ANIMATION_CURVE_EASE_IN: curve = "ease-in"; break;
			case ui.ANIMATION_CURVE_EASE_OUT: curve = "ease-out"; break
			case ui.ANIMATION_CURVE_EASE_IN_OUT: curve = "ease-in-out";
		}

		anim.duration = anim.duration || 0;
		anim.delay = anim.delay || 0;

		// Determine which coordinates are valid and combine with previous coordinates where appropriate.
		if (anim.center) {
			anim.left = anim.center.x - domNode.offsetWidth / 2;
			anim.top = anim.center.y - domNode.offsetHeight / 2;
		}

		// Create the transition, must be set before setting the other properties
		obj.css("transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));

		// Set the color and opacity properties
		anim.backgroundColor !== undef && (obj.backgroundColor = anim.backgroundColor);

		domStyle.opacity = anim.opaque && anim.visible ? 1.0 : 0.0;

		// Set the position and size properties
		require.each(["top", "bottom", "left", "right", "height", "width"], function(p) {
			anim[p] !== undef && (domStyle[p] = px(anim[p]));
		});

		// Set the z-order
		anim.zIndex !== undef && (domStyle.zIndex = anim.zIndex);

		// Set the transform properties
		if (anim.rotation) {
			curRotation = curRotation | 0 + anim.rotation;
			transform += "rotate(" + curRotation + "deg) ";
		}

		if (anim.transform) {
			curTransform = curTransform ? curTransform.multiply(anim.transform) : anim.transform;
			transform += curTransform.toCSS();
		}

		obj.css("transform", transform);

		if (callback) {
			// Note: no IE9 support for transitions, so instead we just set a timer that matches the duration so things don"t break
			setTimeout(function() {
				// Clear the transform so future modifications in these areas are not animated
				obj.css("transition", "");
				callback();
			}, anim.duration + anim.delay + 1);
		}
	};

	args["unselectable"] && (domStyle["-webkit-tap-highlight-color"] = "rgba(0,0,0,0)");

	require.mix(obj, args);
};;
Ti._5.Touchable = function(obj, args) {
	obj.addEventListener || oParentNamespace.EventDriven(obj);

	var on = require.on,
		domNode = obj.dom,
		bEmulate = !("ontouchstart" in window),
		_startPoint = null,
		_endPoint = null,
		_isDoubleTap = false;

	Ti._5.prop(obj, "touchEnabled", args && !!args.touchEnabled);

	on(domNode, bEmulate ? "mousedown" : "touchstart", function(evt) {
		if (!obj.touchEnabled) {
			return true;
		}
		
		var touches = evt.touches ? evt.touches : [evt],
			xCoord = touches[0].pageX,
			yCoord = touches[0].pageY,
			oevt = {
				globalPoint: { x:xCoord, y:yCoord },
				x: xCoord,
				y: yCoord
			};

		_startPoint = oevt.globalPoint;
		_startPoint.source = evt.target;
		_endPoint = oevt.globalPoint;
		obj.fireEvent("touchstart", oevt);

		if (touches.length > 1) {
			obj.fireEvent("twofingertap",  {
				globalPoint: { x:xCoord, y:yCoord },
				x: xCoord,
				y: yCoord
			});
		}
	});

	on(domNode, bEmulate ? "mousemove" : "touchmove", function(evt) {
		if (!obj.touchEnabled || bEmulate && !_startPoint) {
			return true;
		}

		var touches = evt.touches ? evt.touches : [evt],
			xCoord = touches[0].pageX,
			yCoord = touches[0].pageY,
			oevt = {
				globalPoint: { x:xCoord, y:yCoord },
				x: xCoord,
				y: yCoord
			};

		_endPoint = oevt.globalPoint;
		obj.fireEvent("touchmove", oevt);
	});

	on(domNode, bEmulate ? "mouseup" : "touchend", function(evt) {
		if (!obj.touchEnabled) {
			return true;
		}

		_endPoint || (_endPoint = { x: evt.pageX, y: evt.pageY });

		var oevt = {
			globalPoint: { x:_endPoint.x, y:_endPoint.y },
			x: _endPoint.x,
			y: _endPoint.y
		};
		obj.fireEvent("touchend", oevt);

		if (_startPoint && _startPoint.source && _startPoint.source == evt.target && Math.abs(_endPoint.x - _startPoint.x) >= 50) {
			oevt.direction = _endPoint.x > _startPoint.x ? "right" : "left";
			obj.fireEvent("swipe", oevt);
		}
		_startPoint = _endPoint = null;
	});

	on(domNode, "touchcancel", function(evt) {
		if (!obj.touchEnabled) {
			return true;
		}

		obj.fireEvent("touchcancel", {
			globalPoint: { x:evt.pageX, y:evt.pageY },
			x: evt.pageX,
			y: evt.pageY
		});
	});

	on(domNode, "click", function(evt) {
		if (!obj.touchEnabled) {
			return true;
		}

		var oevt = {
			globalPoint: { x:evt.pageX, y:evt.pageY },
			x: evt.pageX,
			y: evt.pageY
		};
		obj.fireEvent("singletap", oevt);

		if (_isDoubleTap = !_isDoubleTap) {
			setTimeout(function() { 
				_isDoubleTap = false;
			}, 400);
		} else {
			obj.fireEvent("doubletap", oevt);
		}
	});
};;
Ti._5.Positionable = function(obj, args) {
	obj.addEventListener || oParentNamespace.EventDriven(obj);

	var domNode = obj.dom,
		domStyle = domNode.style,
		px = Ti._5.px,
		_top,
		_bottom,
		_left,
		_right,
		_width,
		_height,
		_center,
		isAdded;

	Ti._5.prop(obj, {
		top: {
			get: function() {
				return _top;
			},
			set: function(val) {
				domStyle.bottom && (domStyle.bottom = "");
				domStyle.top = _top = px(val);
			}
		},
		bottom: {
			get: function() {
				return _bottom;
			},
			set: function(val) {
				domStyle.top && (domStyle.top = "");
				domStyle.bottom = _bottom = px(val);
			}
		},
		left: {
			get: function() {
				return _left;
			},
			set: function(val) {
				domStyle.right && (domStyle.right = "");
				domStyle.left = _left = px(val);
			}
		},
		right: {
			get: function() {
				return _right;
			},
			set: function(val) {
				domStyle.left && (domStyle.left = "");
				domStyle.right = _right = px(val);
			}
		},
		width: {
			get: function() {
				return _width;
			},
			set: function(val) {
				domStyle.width = _width = px(val);
			}
		},
		height: {
			get: function() {
				return _height;
			},
			set: function(val) {
				domStyle.height = _height = px(val);
			}
		},
		center: {
			get: function() {
				return _center;
			},
			set: function(val) {
				_center = val;

				if (!val || (val.x === null && val.y === null) || !obj.parent) {
					return;
				}

				var width = domNode.clientWidth,
					height = domNode.clientHeight,
					left = val.x,
					top = val.y;

				if (left !== null) {
					/\%$/.test(left) && (left = obj.parent.dom.clientWidth * parseFloat(left) / 100);
					domStyle.left = (left - width / 2) + "px";
				}

				if(top !== null){
					/\%$/.test(top) && (top = obj.parent.dom.clientHeight * parseFloat(top) / 100);
					domStyle.top = (top - height / 2) + "px";
				}

				if (!isAdded) {
					// recalculate center positioning on window resize
					require.on(window, "resize", function() {
						obj.center = _center;
					});
					isAdded = 1;
				}
			}
		}
	});

	obj.addEventListener("html5_added", function(){
		// reset coordinates when element is added somewhere
		obj.center = _center;
	});

	obj.addEventListener("html5_shown", function(){
		// reset coordinates when element is added somewhere
		obj.center = _center;
	});

	obj.addEventListener("html5_child_rendered", function(){
		// reset coordinates when element is added somewhere
		obj.center = _center;
	});

	if(args && args.center) {
		// ignore other position properties when "center" is passed
		delete args.top;
		delete args.bottom;
		delete args.left;
		delete args.right;
	}

	require.mix(obj, args);
};
;
(function(oParentNamespace) {
	if (!oParentNamespace.EventDriven) {
		return false;
	}

	// create a generic DOM view 
	oParentNamespace.DOMView = function(obj, type, args, typename) {
		obj.addEventListener || oParentNamespace.EventDriven(obj);

		typename = typename || "TiDOMNode";

		var domNode = obj.dom = document.createElement(type);
		domNode.className = "HTML5_" + typename + " HTML5_DOMElement";

		obj.args = args = args || {};
		// Object for previous style rules
		obj.prevStyle = {};
		obj.parent = null;
		obj._children || (obj._children = []);

		obj.toString = function() {
			return "[object " + typename + "]";
		};
		
		obj._refresh = function(props) {
			if(props === null){
				return;
			}

			var domprops = props["domprops"],
				obj = props["obj"],
				complexDomprops = props["complexDomprops"],
				args = props["args"];

			if (domprops && args) {
				for (var ii = 0; ii < domprops.length; ii++) {
					// property name
					var domProp = domprops[ii];
					args[domProp] !== undefined && (domNode.style[domProp] = args[domProp]);
				}
			}

			if (complexDomprops && args) {
				for (ii = 0; ii < complexDomprops.length; ii++) {
					var propObj = complexDomprops[ii],
						propKey = null;
					for (var sProp in propObj) {
						propKey = sProp;
						break;
					}
					args[propKey] !== undefined && (obj[propKey] = args[propKey]);
				}
			}
		};

		var _layout;
		Ti._5.prop(obj, "layout", args.layout, {
			get: function() {
				return _layout;
			},
			set: function(val) {
				/^(horizontal|vertical)$/.test(val) || (val = "absolute");
				_layout = val;
				domNode.className = domNode.className.replace(/\s*HTML5_(vertical|horizontal)Layout\b/, "") + " HTML5_" + _layout + "Layout";
				// If layout option setted out of the constructor, we need to redraw object
				if (require.is(obj.render, "Function")) {
					obj.innerHTML = "";
					// if we have been rendered and add is called - re-render
					obj._rendered && obj.render();
				}
			}
		});
		
		// API Methods
		obj.render = function(parent) {
			var c, l,
				convertToMargins = true,
				domStyle = domNode.style;
				pos = "";

			if (!parent && !domNode.parentNode) {
				return;
			}
			if (parent) {
				if (parent.layout === "horizontal") {
					domStyle.display = "inline-block";
				} else if (parent.layout === "vertical") {
					domStyle.display = "";
				} else {
					convertToMargins = false;
					pos = "absolute";
				}

				if (convertToMargins) {
					// Note: we use margins instead of the actual left/right/top/bottom because margins play much nicer with our layout techniques.
					obj.left && (domStyle.marginLeft = obj.left);
					obj.top && (domStyle.marginTop = obj.top);
					obj.right && (domStyle.marginRight = obj.right);
					obj.bottom && (domStyle.marginBottom = obj.bottom);
					domStyle.left = domStyle.right = domStyle.top = domStyle.bottom = "auto";
				}
				parent._getAddContainer().appendChild(domNode);
				obj.fireEvent("html5_added", parent);
			} else {
				pos = "absolute";
			}

			domStyle.position = pos;

			for (c = 0, l = obj._children.length; c < l; c++) {
				obj._children[c].render(obj);
			}
			obj._rendered = true;
				
			// Give some time to browser to render the page
			setTimeout(function() {
				// Fire parent "finished" event 
				obj.parent && obj.parent.fireEvent("html5_child_rendered", obj);
				// Fire object "finished" event 
				obj.fireEvent("html5_rendered");
			}, 10);
		};
		
		// "Finished" event must bubbled to all parents
		obj.addEventListener("html5_child_rendered", function(oSource) {
			obj.parent && obj.parent.fireEvent("html5_child_rendered", oSource);
		});

		obj._getAddContainer = function(){
			return domNode;
		};

		return domNode;
	};
	
	oParentNamespace._getElementOffset = function(node) {
		var i,
			curleft = node.offsetLeft,
			curtop = node.offsetTop,
			w = 0,
			h = 0;

		while (i = (i || node).offsetParent) {
			curleft += i.offsetLeft;
			curtop += i.offsetTop;
		}

		for (i = 0; i < node.children.length; i++) {
			var oSizes = oParentNamespace._getElementOffset(node.children[i]);
			w = Math.max(w, oSizes.width + oSizes.left - curleft);
			h = Math.max(h, oSizes.height + oSizes.top - curtop);
		}

		return {
			left: curleft, 
			top: curtop,
			width: Math.max(w, node.offsetWidth),
			height: Math.max(h, node.offsetHeight)
		}
	};
	
	// Modify siple text to HTML text for looking as expected in some cases (like triple spaces)
	oParentNamespace._changeTextToHTML = function(text) {
		return (""+text).replace(/&/g, "&amp;").replace(/\s{3}/gm, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
	};
})(Ti._5);
;
(function(api){
	Ti._5.EventDriven(api);
	delete api.removeEventListener;

	var ver = require.config.ti.version;

	require.mix(api, {
		version: ver,
		buildDate: "12/22/11 13:09",
		buildHash: "fbdc96f",
		userAgent: "Appcelerator Titanium/" + ver + " (" + navigator.userAgent + ")"
	});

	// Methods
	api.createBlob = function(){
		console.debug('Method "Titanium.createBlob" is not implemented yet.');
	};

	api.include = function(files){
		var i = 0;
		typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
		for (; i < files.length; i++) {
			require("include!" + files[i]);
		}
	};
})(Ti);
;
(function(api){
	// Interfaces
	Ti._5.EventDriven(api);
	var STORAGE = "html5_localStorage";
	var _getProp = function(prop, def, transform){
		if(prop == null){
			return;
		}
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			storage = [];
		} else {
			storage = JSON.parse(storage);
		}
		var val =  storage[prop];
		if(val != null){
			return typeof transform !== 'undefined' ? transform(val) : val;
		} else if (typeof def !== 'undefined'){
			return def;
		}

		return val;
	};

	var _setProp = function(prop, val, transform){
		if(prop == null || typeof val === 'undefined'){
			return;
		}
		val = typeof transform !== 'undefined' ? transform(val) : val;
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			storage = {};
		} else {
			storage = JSON.parse(storage);
		}
		if(prop != null){
			storage[prop] = val;
		}
		localStorage.setItem(STORAGE, JSON.stringify(storage));
	};

	var _parseBoolean = function(val){return Boolean(val);};
	// Methods
	api.getBool = function(prop, def){
		return _getProp(prop, def, _parseBoolean);
	};
	api.getDouble = function(prop, def){
		return _getProp(prop, def, parseFloat);
	};
	api.getInt = function(prop, def){
		return _getProp(prop, def, parseInt);
	};
	api.getList = function(prop, def){
		return _getProp(prop, def, function(val){
			if(val instanceof Array){
				return val;
			}
			return [val];
		});
	};
	api.getString = function(prop, def){
		return _getProp(prop, def, function(val){
			if(typeof val === 'string'){
				return val;
			}
			return val.toString();
		});
	};
	api.hasProperty = function(prop){
		return typeof _getProp(prop) !== 'undefined';
	};
	api.listProperties = function(){
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			return [];
		} else {
			storage = JSON.parse(storage);
		}
		var props = [];
		for(var key in storage){
			props.push(key);
		}

		return props;
	};
	api.removeProperty = function(prop){
		var storage = localStorage.getItem(STORAGE);
		if(storage == null){
			return;
		} else {
			storage = JSON.parse(storage);
		}
		
		delete storage[prop];

		localStorage.setItem(STORAGE, JSON.stringify(storage));
	};
	api.setBool = function(prop, val){
		_setProp(prop, val, _parseBoolean);
	};
	api.setDouble = function(prop, val){
		_setProp(prop, val, parseFloat);
	};
	api.setInt = function(prop, val){
		_setProp(prop, val, parseInt);
	};
	api.setList = function(prop, val){
		_setProp(prop, val, function(val){
			if(val instanceof Array){
				return val;
			}
			return [val];
		});
	};
	api.setString = function(prop, val){
		_setProp(prop, val, function(val){
			return val !== null ? ""+val : null;
		});
	};
})(Ti._5.createClass('Ti.App.Properties'));
;
(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	var lang = navigator.language.replace(/^([^\-\_]+)[\-\_](.+)?$/, function(o, l, c){ return l.toLowerCase() + (c && "-" + c.toUpperCase()); }),
		langParts = lang.split("-");

	// Properties
	Ti._5.propReadOnly(api, {
		currentCountry: langParts[1] || "",
		currentLanguage: langParts[0] || "",
		currentLocale: lang
	});

	// Methods
	api.formatTelephoneNumber = function() {
		console.debug('Method "Titanium.Locale.formatTelephoneNumber" is not implemented yet.');
	};
	api.getCurrencyCode = function() {
		console.debug('Method "Titanium.Locale.getCurrencyCode" is not implemented yet.');
	};
	api.getCurrencySymbol = function() {
		console.debug('Method "Titanium.Locale.getCurrencySymbol" is not implemented yet.');
	};
	api.getLocaleCurrencySymbol = function() {
		console.debug('Method "Titanium.Locale.getLocaleCurrencySymbol" is not implemented yet.');
	};
	api.getString = function(str, hintText) {
		var data = Ti._5.getLocaleData();
		if(typeof data[api.currentLanguage] != 'undefined' && typeof data[api.currentLanguage][str] != 'undefined') {
			return data[api.currentLanguage][str];
		} else if (typeof hintText != 'undefined'){
			return hintText;
		}
		return str;
	};
})(Ti._5.createClass("Ti.Locale"));

// L = Ti.Locale.getString;
Object.defineProperty(window, "L", { value: Ti.Locale.getString, enumarable: true });

(function(api){
	// format a generic string using the [IEEE printf specification](http://www.opengroup.org/onlinepubs/009695399/functions/printf.html).
	api.format = function(s) {
		console.debug('Method "String.format" is not implemented yet.');
		return [].concat(Array.prototype.slice.call(arguments, 0)).join(" ");
	};

	// format a date into a locale specific date format. Optionally pass a second argument (string) as either "short" (default), "medium" or "long" for controlling the date format.
	api.formatDate = function(dt, fmt) {
		console.debug('Method "String.formatDate" is not implemented yet.');
		return dt.toString();
	};

	// format a date into a locale specific time format.
	api.formatTime = function(dt) {
		console.debug('Method "String.formatTime" is not implemented yet.');
		return dt.toString();
	};

	// format a number into a locale specific currency format.
	api.formatCurrency = function(amt) {
		console.debug('Method "String.formatCurrency" is not implemented yet.');
		return amt;
	};

	// format a number into a locale specific decimal format.
	api.formatDecimal = function(dec) {
		console.debug('Method "String.formatDecimal" is not implemented yet.');
		return dec;
	};
})(String);
;
(function(api){

	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/),
		runtime = match ? match[0] : "unknown",
		createUUID = Ti._5.createUUID,
		id = localStorage && localStorage.getItem("html5_titaniumPlatformId") ?
			localStorage.getItem("html5_titaniumPlatformId") : createUUID();

	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.propReadOnly(api, {
		BATTERY_STATE_CHARGING: 1,
		BATTERY_STATE_FULL: 2,
		BATTERY_STATE_UNKNOWN: -1,
		BATTERY_STATE_UNPLUGGED: 0,
		address: null,
		architecture: null,
		availableMemory: null,
		batteryLevel: null,
		batteryMonitoring: null,
		batteryState: api.BATTERY_STATE_UNKNOWN,
		id: id,
		isBrowser: true,
		locale: navigator.language,
		macaddress: null,
		model: null,
		name: navigator.userAgent,
		netmask: null,
		osname: "mobileweb",
		ostype: navigator.platform,
		runtime: runtime,
		processorCount: null,
		username: null,
		version: require.config.ti.version
	});

	// Methods
	api.createUUID = createUUID;

	api.canOpenURL = function(url){
		return true;
	};

	api.openURL = function(url){
		var m = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?/.exec(url);
		if ( (/^([tel|sms|mailto])/.test(url) || /^([\/?#]|[\w\d-]+^:[\w\d]+^@)/.test(m[1])) && !/^(localhost)/.test(url) ) {
			setTimeout(function () {
				window.location.href = url;
			}, 1);
		} else {
			window.open(url);
		}
	};

	localStorage.setItem("html5_titaniumPlatformId", id);

})(Ti._5.createClass("Ti.Platform"));
;
(function(api){
	var _backgroundColor = null,
		_backgroundImage = null;

	api.currentWindow = null;
	api.currentTab = null;

	// Properties
	Ti._5.propReadOnly(api, {
		UNKNOWN: 0,
		FACE_DOWN: 1,
		FACE_UP: 2,
		PORTRAIT: 3,
		UPSIDE_PORTRAIT: 4,
		LANDSCAPE_LEFT: 5,
		LANDSCAPE_RIGHT: 6,
		INPUT_BORDERSTYLE_BEZEL: 3,
		INPUT_BORDERSTYLE_LINE: 1,
		INPUT_BORDERSTYLE_NONE: 0,
		INPUT_BORDERSTYLE_ROUNDED: 2,
		INPUT_BUTTONMODE_ALWAYS: 1,
		INPUT_BUTTONMODE_NEVER: 0,
		INPUT_BUTTONMODE_ONBLUR: 0,
		INPUT_BUTTONMODE_ONFOCUS: 1,
		KEYBOARD_APPEARANCE_ALERT: 1,
		KEYBOARD_APPEARANCE_DEFAULT: 0,
		KEYBOARD_ASCII: 1,
		KEYBOARD_DEFAULT: 2,
		KEYBOARD_EMAIL: 3,
		KEYBOARD_NAMEPHONE_PAD: 4,
		KEYBOARD_NUMBERS_PUNCTUATION: 5,
		KEYBOARD_NUMBER_PAD: 6,
		KEYBOARD_PHONE_PAD: 7,
		KEYBOARD_URL: 8,
		NOTIFICATION_DURATION_LONG: 1,
		NOTIFICATION_DURATION_SHORT: 2,
		PICKER_TYPE_COUNT_DOWN_TIMER: 1,
		PICKER_TYPE_DATE: 2,
		PICKER_TYPE_DATE_AND_TIME: 3,
		PICKER_TYPE_PLAIN: 4,
		PICKER_TYPE_TIME: 5,
		RETURNKEY_DEFAULT: 0,
		RETURNKEY_DONE: 1,
		RETURNKEY_EMERGENCY_CALL: 2,
		RETURNKEY_GO: 3,
		RETURNKEY_GOOGLE: 4,
		RETURNKEY_JOIN: 5,
		RETURNKEY_NEXT: 6,
		RETURNKEY_ROUTE: 7,
		RETURNKEY_SEARCH: 8,
		RETURNKEY_SEND: 9,
		RETURNKEY_YAHOO: 10,
		TEXT_ALIGNMENT_CENTER: 1,
		TEXT_ALIGNMENT_RIGHT: 2,
		TEXT_ALIGNMENT_LEFT: 3,
		TEXT_AUTOCAPITALIZATION_ALL: 3,
		TEXT_AUTOCAPITALIZATION_NONE: 0,
		TEXT_AUTOCAPITALIZATION_SENTENCES: 2,
		TEXT_AUTOCAPITALIZATION_WORDS: 1,
		TEXT_VERTICAL_ALIGNMENT_BOTTOM: 2,
		TEXT_VERTICAL_ALIGNMENT_CENTER: 1,
		TEXT_VERTICAL_ALIGNMENT_TOP: 3
	});

	Ti._5.prop(api, {
		backgroundColor: {
			get: function(){return _backgroundColor;},
			set: function(val){
				_backgroundColor = val;
				api.setBackgroundColor(_backgroundColor);
			}
		},
		backgroundImage: {
			get: function(){return _backgroundImage;},
			set: function(val){
				_backgroundImage = val;
				api.setBackgroundImage(_backgroundImage);
			}
		}
	});

	// Methods
	api.setBackgroundColor = function(args) {
		Ti._5.containerDiv.style.backgroundColor = args;
	};
	
	api.setBackgroundImage = function(args) {
		Ti._5.containerDiv.style.backgroundImage = "url(" + Ti._5.getAbsolutePath(args) + ")";
	};
	
	api.create2DMatrix = function(args){
		return new Ti.UI["2DMatrix"](args);
	};
	api.create3DMatrix = function(){
		console.debug('Method "Titanium.UI.create3DMatrix" is not implemented yet.');
	};
	api.createActivityIndicator = function(args){
		return new Ti.UI.ActivityIndicator(args);
	};
	api.createAlertDialog = function(args){
		return new Ti.UI.AlertDialog(args);
	};
	api.createAnimation = function(args){
		return new Ti.UI.Animation(args);
	};
	api.createButton = function(args) {
		return new Ti.UI.Button(args);
	};
	api.createButtonBar = function(){
		console.debug('Method "Titanium.UI.createButtonBar" is not implemented yet.');
	};
	api.createCoverFlowView = function(){
		console.debug('Method "Titanium.UI.createCoverFlowView" is not implemented yet.');
	};
	api.createDashboardItem = function(){
		console.debug('Method "Titanium.UI.createDashboardItem" is not implemented yet.');
	};
	api.createDashboardView = function(){
		console.debug('Method "Titanium.UI.createDashboardView" is not implemented yet.');
	};
	api.createEmailDialog = function(){
		console.debug('Method "Titanium.UI.createEmailDialog" is not implemented yet.');
	};
	api.createImageView = function(args){
		return new Ti.UI.ImageView(args);
	};
	api.createLabel = function(args) {
		return new Ti.UI.Label(args);
	};
	api.createOptionDialog = function(){
		console.debug('Method "Titanium.UI.createOptionDialog" is not implemented yet.');
	};
	api.createPicker = function(args) {
		return new Ti.UI.Picker(args);
	}
	api.createPickerColumn = function(){
		console.debug('Method "Titanium.UI.createPickerColumn" is not implemented yet.');
	};
	api.createPickerRow = function(args){
		return new Ti.UI.PickerRow(args);
	};
	api.createProgressBar = function(){
		console.debug('Method "Titanium.UI.createProgressBar" is not implemented yet.');
	};
	api.createScrollView = function(args) {
		return new Ti.UI.ScrollView(args);
	};
	api.createScrollableView = function(args){
		return new Ti.UI.ScrollableView(args);
	};
	api.createSearchBar = function(args){
		return new Ti.UI.SearchBar(args);
	};
	api.createSlider = function(args){
		return new Ti.UI.Slider(args);
	};
	api.createSwitch = function(args){
		return new Ti.UI.Switch(args);
	};
	api.createTab = function(args){
		return new Ti.UI.Tab(args);
	};
	api.createTabGroup = function(args){
		return new Ti.UI.TabGroup(args);
	};
	api.createTabbedBar = function(){
		console.debug('Method "Titanium.UI.createTabbedBar" is not implemented yet.');
	};
	api.createTableView = function(args) {
		return new Ti.UI.TableView(args);
	};
	api.createTableViewRow = function(args){
		return new Ti.UI.TableViewRow(args);
	};
	api.createTableViewSection = function(args){
		return new Ti.UI.TableViewSection(args);
	};
	api.createTextArea = function(args) {
		return new Ti.UI.TextArea(args);
	};
	api.createTextField = function(args) {
		return new Ti.UI.TextField(args);
	};
	api.createToolbar = function(){
		console.debug('Method "Titanium.UI.createToolbar" is not implemented yet.');
	};
	api.createView = function(args) {
		return new Ti.UI.View(args);
	};
	api.createWebView = function(args) {
		return new Ti.UI.WebView(args);
	};
	api.createWindow = function(args) {
		return new Ti.UI.Window(args);
	};
})(Ti._5.createClass("Ti.UI"));
;
Ti._5.createClass("Ti.UI.Window", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "Window"),
		domStyle = domNode.style,
		_titleid = null,
		_titlepromptid = null,
		_url = null,
		_title;

	function isHTMLPage(){
		return _url != null && (_url.indexOf("htm") != -1 || _url.indexOf("http") != -1);
	}

	// Interfaces
	Ti._5.Screen(obj, args);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	Ti._5.Clickable(obj);
	Ti._5.Interactable(obj, true);

	// Properties
	Ti._5.prop(obj, {
		backButtonTitle: null,
		backButtonTitleImage: null,
		barColor: null,
		barImage: null,
		exitOnClose: null,
		fullscreen: false,
		leftNavButton: null,
		modal: null,
		navBarHidden: null,
		orientationModes: [],
		rightNavButton: null,
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		softInputMode: null,
		tabBarHidden: null,
		titleControl: null,
		title: {
			get: function() {
				return _title;
			},
			set: function(val) {
				_title = val;
				setTitle();
			}
		},
		titleid: {
			get: function(){return _titleid;},
			set: function(val){obj.title = L(_titleid = val);}
		},
		titleImage: null,
		titlePrompt: null,
		titlepromptid: {
			get: function(){return _titlepromptid;},
			set: function(val){
				obj.titlePrompt = L(_titlepromptid = val);
			}
		},
		toolbar: null,
		translucent: null,
		url: {
			get: function(){return _url;},
			set: function(val){
				_url = val;
				if (isHTMLPage()) {
					window.location.href = Ti._5.getAbsolutePath(_url);
				} else {
					// We need this for proper using window.open in code
					setTimeout(function(){
						var prevWindow = Ti.UI.currentWindow;
						Ti.UI.currentWindow = obj;
						require("include!sandbox!" + _url);
						Ti.UI.currentWindow = prevWindow;
					}, 1);
				}
			}
		}
	});

	var _oldHide = obj.hide; // WARNING: this may cause problems
	obj.hide = function() {
		obj.fireEvent("blur", {source: domNode});
		_oldHide();
	};

	function setTitle() {
		Ti.UI.currentWindow === obj && (document.title = obj.title != null ? obj.title : Ti._5.getArguments().projectName);
	}

	// Methods
	obj.addEventListener("screen_open", function() {
		Ti.UI.currentWindow = obj;
		obj.render(null);
		setTitle();
		obj.fireEvent("open", {source: null});
		obj.fireEvent("focus", {source: domNode});
	});
	obj.addEventListener("screen_close", function() {
		obj.fireEvent("blur", {source: domNode});
		obj.fireEvent("close", {source: null});
		if(!isHTMLPage()){
			// remove script include
			var head = document.getElementsByTagName("head")[0];
			head.removeChild(head.children[head.children.length - 1]);
		}
	});
	obj.open = function(){
		obj.screen_open();
	};

	obj.close = function(){
		obj.screen_close();
	};

	require.mix(obj, args);

	function setMinHeight(oSource) {
		oSource = oSource || obj;
		if (!oSource.dom) {
			return;
		}
		// Set min window height for preventing window heights be smaller then sum of all window children heights  
		var oElOffset = Ti._5._getElementOffset(oSource.dom);
		//domStyle.minHeight = (oElOffset.height - oElOffset.top) + "px";
		domStyle.minHeight = oElOffset.height + "px";
	}

	var _oldRender = obj.render; // WARNING: this may cause problems
	obj.render = function(parent) {
		_oldRender(parent);
		// Get first element margin
		var _maxChildrenHeight = 0;
		if (obj._children) {
			var _padding = 0;
			if (obj._children[0] && obj._children[0].dom) {
				_padding = parseInt(obj._children[0].dom.style.marginTop);
			}
			domStyle.paddingTop = _padding + "px";
			for (var c=0;c<obj._children.length;c++) {
				obj._children[c].render(obj);
			}
		}
		setMinHeight(obj);
	};
	
	obj.addEventListener("html5_child_rendered", function () {
		// Give some time to browser to render the page
		setTimeout(setMinHeight, 100);
	});

	require.on(window, "resize", function() {setMinHeight();});
	require.on(window, "load", function() {setMinHeight();});
});
;
Ti._5.createClass("Ti.UI.Label", function(args){
	args = require.mix({
		backgroundColor: "none",
		textAlign: "-webkit-auto",
		unselectable: true
	}, args);

	var undef,
		obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "Label"),
		domStyle = domNode.style,
		px = Ti._5.px,
		_shadowColor = null,
		_shadowOffset = null,
		_title = "",
		_textid = null,
		_selectedColor = null,
		_prevTextColor = null,
		_selectedColorLoaded = false;

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);
	args.backgroundPaddingLeft = args.backgroundPaddingLeft || "0";
	args.backgroundPaddingTop = args.backgroundPaddingTop || "0";
	domStyle.overflow = "hidden";

	function setShadow() {
		domStyle["-webkit-box-shadow"] = (_shadowColor || "#000") + " " + 
			(_shadowOffset && _shadowOffset.x || 0) + "px " + 
			(_shadowOffset && _shadowOffset.y || 0) + "px ";
	}

	// Properties
	Ti._5.prop(obj, {
		autoLink: undef,
		backgroundPaddingBottom: undef,
		backgroundPaddingLeft: {
			get: function(){return domStyle.backgroundPositionX;},
			set: function(val){domStyle.backgroundPositionX = px(val);}
		},
		backgroundPaddingRight: undef,
		backgroundPaddingTop: {
			get: function(){return domStyle.backgroundPositionY;},
			set: function(val){domStyle.backgroundPositionY = px(val);}
		},
		ellipsize: false,
		highlightedColor: undef,
		html: {
			get: function(){return obj.text},
			set: function(val){obj.text = val;}
		},
		minimumFontSize: undef,
		selectedColor: {
			get: function(){return _selectedColor;},
			set: function(val) {
				_selectedColor = val;
				if (!_selectedColorLoaded) {
					_selectedColorLoaded = true;
					require.on(domNode, "focus", function() {
						_prevTextColor = obj.color;
						obj.color = _selectedColor;
					});
					require.on(domNode, "blur", function() {
						_prevTextColor && (obj.color = _prevTextColor);
					});
				}
			}
		},
		shadowColor: {
			get: function(){return _shadowColor;},
			set: function(val){_shadowColor = val; setShadow();}
		},
		shadowOffset: {
			get: function(){return _shadowOffset;},
			set: function(val){_shadowOffset = val; setShadow();}
		},
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = px(val.width));
				val.height && (obj.height = px(val.height));
			}
		},
		text: {
			get: function(){return _title ? _title : domNode.innerHTML;},
			set: function(val){
				_title = ""+val; 
				domNode.innerHTML = Ti._5._changeTextToHTML(val); 
				// if we have been rendered and add is called - re-render
				if (
					!obj._rendered ||
					!obj.parent || !obj.parent.dom || 
					!domNode.offsetHeight && !domNode.offsetWidth || 
					!obj.parent.dom.offsetHeight && !obj.parent.dom.offsetWidth
				) {
					return _title;
				}
				obj.render(null);
			}
		},
		textAlign: {
			get: function(){return domStyle.textAlign;},
			set: function(val){domStyle.textAlign = val;}
		},
		textid: {
			get: function(){return _textid;},
			set: function(val){text = L(_textid = val);}
		},
		wordWrap: {
			get: function(){return true;}
		}
	});

	require.mix(obj, args);
});
;
Ti._5.createClass("Ti.UI.Button", function(args){
	var obj = this,
		domNode = Ti._5.DOMView(obj, "button", args, "Button"),
		_title = "",
		_titleObj,
		_image,
		_imageObj,
		_backgroundImage = null,
		_borderWidthCache = "",
		_backgroundImageCache = "",
		_backgroundColorCache = "",
		_enabled = true,
		_backgroundDisabledImage = null,
		_backgroundDisabledColor = null,
		_selectedColor = null,
		_prevTextColor = null,
		_selectedColorLoaded = false,
		_titleid = null;

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		backgroundDisabledColor: {
			get: function() {
				return _backgroundDisabledColor ? _backgroundDisabledColor : "";
			},
			set: function(val) {
				_backgroundDisabledColor = val;
			}
		},
		backgroundDisabledImage: {
			get: function() {
				return _backgroundDisabledImage ? _backgroundDisabledImage : "";
			},
			set: function(val) {
				_backgroundDisabledImage = val;
			}
		},
		backgroundImage: {
			get: function() {
				return _backgroundImage;
			},
			set: function(val) {
				_backgroundImage = val;
	
				if (val) {
					// cache borderWidth, backgroundColor to restore them later
					_borderWidthCache = obj.borderWidth;
					_backgroundColorCache = obj.dom.style.backgroundColor;
					obj.dom.style.borderWidth = 0;
					obj.dom.style.backgroundColor = "transparent";
					obj.dom.style.backgroundImage = "url(" + Ti._5.getAbsolutePath(val) + ")";
				} else {
					obj.dom.style.borderWidth = _borderWidthCache;
					obj.dom.style.backgroundColor = _backgroundColorCache;
					obj.dom.style.backgroundImage = "";
				}
			}
		},
		enabled: {
			get: function(){return _enabled;},
			set: function(val) {
				// do nothing if widget is already in obj state
				if(_enabled !== val){
					_enabled = val;
					if(_enabled) {
						obj.dom.disabled = false;
						if(_backgroundImageCache){
							obj.backgroundImage = _backgroundImageCache;
						}
						if(_backgroundColorCache){
							obj.backgroundColor = _backgroundColorCache;
						}
		
						_backgroundImageCache = null;
						_backgroundColorCache = null;
					} else {
						obj.dom.disabled = true;
						if (_backgroundDisabledImage) {
							if (obj.backgroundImage) {
								_backgroundImageCache = obj.backgroundImage;
							}
							obj.backgroundImage = _backgroundDisabledImage;
						}
						if (_backgroundDisabledColor) {
							if (obj.backgroundColor) {
								_backgroundColorCache = obj.backgroundColor;
							}
							obj.backgroundColor = _backgroundDisabledColor;
						}
					}
				}
			}
		},
		image: {
			get: function() {return _image;},
			set: function(val){
				if (_imageObj == null) {
					_imageObj = document.createElement("img");
					if(_titleObj){
						// insert image before title
						obj.dom.insertBefore(_imageObj, _titleObj);
					} else {
						obj.dom.appendChild(_imageObj);
					}
				}
				_image = Ti._5.getAbsolutePath(val);
				_imageObj.src = _image;
			}
		},
		selectedColor: {
			get: function(){return _selectedColor;},
			set: function(val) {
				_selectedColor = val;
				if (!_selectedColorLoaded) {
					_selectedColorLoaded = true;
					require.on(obj.dom, "focus", function() {
						_prevTextColor = obj.color;
						obj.color = _selectedColor;
					});
					require.on(obj.dom, "blur", function() {
						_prevTextColor && (obj.color = _prevTextColor);
					});
				}
			}
		},
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		style: null,
		title: {
			get: function() {return _title || obj.dom.innerHTML;},
			set: function(val) {
				_title = val;
				_titleObj && obj.dom.removeChild(_titleObj);
				_titleObj = document.createTextNode(_title);
				obj.dom.appendChild(_titleObj);
			}
		},
		titleid: {
			get: function(){return _titleid;},
			set: function(val){obj.title = L(_titleid = val);}
		}
	});

	obj.add = function(view) {
		obj._children = obj._children || [];
		obj._children.push(view);

		// if we have been rendered and add is called - re-render
		obj._rendered && obj.parent && obj.parent.dom && (obj.dom.offsetHeight || obj.dom.offsetWidth) && (obj.parent.dom.offsetHeight || obj.parent.dom.offsetWidth) && obj.render(null);
	};

	require.mix(obj, args);
});
;
(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	var undef;

	// Properties
	Ti._5.propReadOnly(api, {
		ACCURACY_BEST: 0,
		ACCURACY_HUNDRED_METERS: 2,
		ACCURACY_KILOMETER: 3,
		ACCURACY_NEAREST_TEN_METERS: 1,
		ACCURACY_THREE_KILOMETERS: 4,

		AUTHORIZATION_AUTHORIZED: 4,
		AUTHORIZATION_DENIED: 1,
		AUTHORIZATION_RESTRICTED: 2,
		AUTHORIZATION_UNKNOWN: 0,

		ERROR_DENIED: 1,
		ERROR_HEADING_FAILURE: 2,
		ERROR_LOCATION_UNKNOWN: 3,
		ERROR_NETWORK: 0,
		ERROR_REGION_MONITORING_DELAYED: 4,
		ERROR_REGION_MONITORING_DENIED: 5,
		ERROR_REGION_MONITORING_FAILURE: 6,

		PROVIDER_GPS: 1,
		PROVIDER_NETWORK: 2
	});

	Ti._5.prop(api, {
		accuracy: api.ACCURACY_BEST,
		locationServicesAuthorization: undef,
		locationServicesEnabled: undef,
		preferredProvider: undef,
		purpose: undef,
		showCalibration: true
	});

	// Methods
	api.getCurrentPosition = function(callbackFunc) {
		if (_lastPosition && require.is(callbackFunc, "Function")) {
			callbackFunc(_lastPosition);
			return;
		}
		if (_lastError) {
			require.is(callbackFunc, "Function") && callbackFunc(_lastError);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			function(oPos){
				require.is(callbackFunc, "Function") && callbackFunc({
					code: 0,
					coords: {
						latitude : oPos.coords.latitude,
						longitude : oPos.coords.longitude,
						altitude : oPos.coords.altitude,
						heading : oPos.coords.heading,
						accuracy : oPos.coords.accuracy,
						speed : oPos.coords.speed,
						altitudeAccuracy : oPos.coords.altitudeAccuracy,
						timestamp : oPos.timestamp
					},
					error: "",
					success: true
				});
			},
			function(oError){
				require.is(callbackFunc, "Function") && callbackFunc({
					coords: null,
					error: oError.message,
					message: oError.message,
					success: false
				});
			},
			{
				enableHighAccuracy : _accuracy < 3 || api.ACCURACY_BEST === _accuracy
			}
		);
	};

	var _watchId,
		_oldAddEventListener = api.addEventListener, // WARNING: this may cause problems
		_lastPosition = null,
		_lastError = null;

	api.addEventListener = function(eventType, callback){
		_oldAddEventListener(eventType, callback);
		if(eventType == "location"){
			_watchId = navigator.geolocation.watchPosition(
				function(oPos){
					_lastError = null;

					api.fireEvent("location", _lastPosition = {
						code: 0,
						coords : {
							latitude : oPos.coords.latitude,
							longitude : oPos.coords.longitude,
							altitude : oPos.coords.altitude,
							heading : oPos.coords.heading,
							accuracy : oPos.coords.accuracy,
							speed : oPos.coords.speed,
							altitudeAccuracy : oPos.coords.altitudeAccuracy,
							timestamp : oPos.timestamp
						},
						error: "",
						provider: null,
						success: true
					});
					/*
					if (oPos.heading) {
						api.fireEvent("heading", oPos);
					}
					*/
				},
				function(oError){
					_lastPosition = null;

					api.fireEvent("location", _lastError = {
						coords: null,
						error: oError.message,
						message: oError.message,
						provider: null,
						success: false
					});
					/*
					if (oPos.heading) {
						api.fireEvent("heading", oPos);
					}
					*/
				},
				{
					enableHighAccuracy : _accuracy < 3 || api.ACCURACY_BEST === _accuracy
				}
			);
		}
	};
	var _oldRemoveEventlistener = api.removeEventListener; // WARNING: this may cause problems
	api.removeEventListener = function(eventName, cb){
		_oldRemoveEventlistener(eventName, cb);
		if(eventName == "location"){
			navigator.geolocation.clearWatch(_watchId);
		}
	};

	api.forwardGeocoder = function(address, callbackFunc) {};
	api.getCurrentHeading = function(callbackFunc) {};
	api.reverseGeocoder = function(latitude, longitude, callbackFunc) {};
	api.setShowCalibration = function(val) {
		/*
		if ("undefined" == typeof val) {
			val = true;
		}
		*/
		api.showCalibration = !!val;
	};
})(Ti._5.createClass("Ti.Geolocation"));
;
(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Methods
	require.each(["debug", "error", "info", "log", "warn"], function(fn) {
		api[fn] = function(msg) {
			console[fn]("[" + fn.toUpperCase() + "] " + msg);
		};
	});

})(Ti._5.createClass('Ti.API'));;
Ti._5.createClass("Ti.UI.TabGroup", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var undef,
		obj = this;
		domNode = Ti._5.DOMView(obj, "div", args, "TabGroup"),
		_activeTabIndex = null,
		_barColor = null;

	// Interfaces
	Ti._5.Screen(obj, args);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	domNode.position = "absolute";

	// create DOM sctructure for the instance
	// lets store tab headers as table - obj is much more easy to resize and rewrap rather then do it manually
	var _headerTable = document.createElement("table");
	_headerTable.cellSpacing = 0;
	_headerTable.className = "tabsHeaders";
	var _tabsHeaders = document.createElement("tbody");
	_headerTable.appendChild(_tabsHeaders);
	var _tabsContent = document.createElement("div");
	_tabsContent.className = "tabsContent";
	_tabsContent.style.width = "100%";
	_tabsContent.style.height = "90%";
	_tabsContent.style.position = "absolute";
	domNode.appendChild(_headerTable);
	domNode.appendChild(_tabsContent);

	obj._tabs = [];

	// Properties
	Ti._5.prop(obj, {
		activeTab: {
			get: function(){return obj._tabs[_activeTabIndex];},
			set: function(val){obj.setActiveTab(val);}
		},
		allowUserCustomization: undef,
		barColor: {
			get: function(){return _barColor;},
			set: function(val){
				_tabsHeaders.style.backgroundColor = _barColor = val;
			}
		},
		editButtonTitle: undef,
		tabs: {
			get: function(){
				var res = [];
				for(var ii = 0; ii < obj._tabs.length; ii++){
					res.push(obj._tabs[ii]);
				}
				return res;
			}
		}
	});

	// Methods
	obj.addTab = function(tab){
		_tabsHeaders.appendChild(tab._header);
		_tabsContent.appendChild(tab.dom);

		obj._tabs.push(tab);
		tab._tabGroup = obj;

		if(_activeTabIndex == null){
			obj.setActiveTab(obj._tabs.length - 1);
		} else {
			tab.hide();
		}
		tab.render();
	};

	obj.removeTab = function(tabObj){
		for(var ii = obj._tabs.length - 1; ii >= 0; ii--){
			var tab = obj._tabs[ii];
			if(tab == tabObj){
				obj._tabs.splice(ii, 1);
				_tabsHeaders.removeChild(tab._header);
				_tabsContent.removeChild(tab.dom);
				tab._tabGroup = null;

				if(_activeTabIndex == ii){
					// removing current opened tab
					_activeTabIndex = null;

					// after removing tab array length is decremented
					if(ii == obj._tabs.length){
						// obj was last tab - open previous
						obj.setActiveTab(obj._tabs.length - 1);
					} else {
						// show tab after removed one
						obj.setActiveTab(ii);
					}
				} else if(_activeTabIndex > ii) {
					_activeTabIndex--;
				}
				break;
			}
		}
	};

	function hideTab(tabIndex){
		if(tabIndex == null && tabIndex > obj._tabs.length){
			return;
		}

		var tab = obj._tabs[tabIndex];
		tab._header.className = tab._header.className.replace(/\bactiveTabHeader\b/, "");
		tab.dom.style.display = "none";
		tab.hide();
	}

	function showTab(tabIndex){
		if(tabIndex == null && tabIndex > obj._tabs.length){
			return;
		}

		var tab = obj._tabs[tabIndex];
		tab._header.className += " activeTabHeader";
		tab.dom.style.display = "";
		tab.show();
	}

	obj.setActiveTab = function(indexOrObject){
		if(typeof indexOrObject === "object"){
			for(var ii = obj._tabs.length - 1; ii >= 0; ii--){
				if(obj._tabs[ii] === indexOrObject){
					obj.setActiveTab(ii);
					return;
				}
			}

			// tab not found - add new
			obj.addTab(indexOrObject);
			obj.setActiveTab(obj._tabs.length - 1);
		} else if (indexOrObject !== _activeTabIndex) {
			if(_activeTabIndex != null){
				obj.fireEvent("blur", {
					globalPoint: {x: null, y: null},
					x: null,
					y: null,
					previousIndex: _activeTabIndex,
					previousTab: obj._tabs[_activeTabIndex],
					tab: obj._tabs[indexOrObject]
				});
				hideTab(_activeTabIndex);
			}

			obj.fireEvent("focus", {
				globalPoint: {x: null, y: null},
				x: null,
				y: null,
				previousIndex: _activeTabIndex,
				previousTab: _activeTabIndex != null && _activeTabIndex < obj._tabs.length ? obj._tabs[_activeTabIndex] : null,
				tab: obj._tabs[indexOrObject]
			});
			_activeTabIndex = indexOrObject;
			showTab(_activeTabIndex);
		}
	};

	obj.open = function(){
		obj.screen_open();
		if(_activeTabIndex > obj.tabs.length){
			_activeTabIndex = null;
		}

		Ti.UI.currentTabGroup = obj;
		obj.show();
		if(obj._tabs.length > 0){
			obj.setActiveTab(_activeTabIndex || 0);
		}

		obj.fireEvent("open", {
			globalPoint: {x: null, y: null},
			x: null,
			y: null
		});
	};

	obj.close = function(){
		obj.screen_close();
		obj.hide();
		if(Ti.UI.currentTabGroup == obj){
			Ti.UI.currentTabGroup = null;
		}

		obj.fireEvent("close", {
			globalPoint: {x: null, y: null},
			x: null,
			y: null
		});
	};

	require.mix(obj, args);
});
;
Ti._5.createClass("Ti.UI.Tab", function(args){
	args = require.mix({
		height: "100%",
		width: "100%"
	}, args);

	var undef,
		obj = this,
		_icon = null,
		_title = null,
		_titleid = null,
		_window = null;

	// Interfaces
	Ti._5.DOMView(obj, "div", args, "Tab");
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	obj._header = document.createElement("td");
	obj._header.className = "tabHeader";
	obj._header.onclick = function(){
		if(obj._tabGroup == null){
			return;
		}
		
		for(var ii = obj._tabGroup._tabs.length - 1; ii >= 0; ii--){
			if(obj._tabGroup._tabs[ii] === obj){
				obj._tabGroup.setActiveTab(ii);
				break;
			}
		}
	};
	
	// reference to tabGroup object that holds current tab
	obj._tabGroup = null;

	var _oldShow = obj.show; // WARNING: this may cause problems
	obj.show = function(){
		_oldShow();
		if(_window){
			_window.show();
		}
		Ti.UI.currentTab = obj;
	};

	var _oldHide = obj.hide; // WARNING: this may cause problems
	obj.hide = function(){
		_oldHide();
		if(_window){
			_window.hide();
		}
		if(Ti.UI.currentTab == obj){
			Ti.UI.currentTab = null;
		}
	};

	obj.open = function(win, args){
		win.open(args);
	};

	// Properties
	Ti._5.prop(obj, {
		"badge": undef,
		"icon": {
			get: function(){return _icon;},
			set: function(val){
				if(val == null || val == ''){
					// remove icon
					obj._header.style.backgroundImage = '';
				} else {
					obj._header.style.backgroundImage = 'url(' + Ti._5.getAbsolutePath(val) + ')';
				}
				_icon = val;
			}
		},
		"title": {
			get: function(){return _title;},
			set: function(val){
				obj._header.innerHTML = _title = val;
			}
		},
		"titleid": {
			get: function(){return _titleid;},
			set: function(val){
				obj.title = L(_titleid = val);
			}
		},
		"win": {
			get: function(){return obj.window;},
			set: function(val){obj.window = val;}
		},
		"window": {
			get: function(){return _window;},
			set: function(val){
				_window = val;
				obj.add(_window);
				_window;
			}
		}
	});

	require.mix(obj, args);
});
;
