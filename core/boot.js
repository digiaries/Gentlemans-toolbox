(function(){

	var base_path = window.location.pathname;
	base_path = base_path.substr(0, base_path.lastIndexOf('/') + 1);

	function BASE(path){
		if (path.charAt(0) != '/'){
			path = base_path + path;
		}
		return path;
	}

	// SeaJS全局配置
	seajs.config({
		base: BASE("modules/"),
		alias: {
			// 目录缩写
			"core":BASE("core")
			,"libs":BASE("libs")
			,"tpls":BASE("templates")
			// 基本模块缩写
			,"app":BASE("core/core.js")
			,"util":BASE("core/util")
			,"view":BASE("core/view")
			,"widget":BASE("core/widget")
			,"config":BASE("core/config")
			,"datacenter":BASE("core/datacenter")
			,"messager":BASE("core/messager")
			,"tpl":BASE("core/template")
			,"less":BASE("libs/less/1.3.1.js")
			,"jquery":BASE("libs/jquery/2.0.js")
		},
		map: [
			[/^.*$/, function(url){
				/* 加入版本号码 */
				if (window.VERSION){
					url += (url.indexOf('?') == -1 ? '?v=' : '&v=') + window.VERSION;
				}
				return url;
			}]
		],
		preload:[],
		debug: 0
	});

	// LESS 开发者模式
	window.less = {
		"env":'development'
		,"rawURL":false
		,"baseURL":"resources/css/"
	};
})();

define(function(require,exports){

	var core = require("app")
		,main = require("pages/main");

	require.async('less');

	core.init(null,function(){
		console.log("App onlink.");

		core.root.create(
			"MainPage"
			,main.page
		);
	});

});