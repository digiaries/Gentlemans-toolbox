define(function(require, exports){
	var $ = require("jquery")
		,Core = require("app")
		,view = require("view")
		,tpl = require("tpl")
		// ,test = require("test")
		,widget = require("widget");

	/**
	 * 简单的功能路由
	 * @param  {Object}    ev 鼠标事件
	 * @return {Undefined}    无返回值
	 */
	function go(ev){
		var tag = $(ev.target)
			,action = tag.attr("data-action")
			,module = tag.attr("data-module")
			,method = tag.attr("data-method")
			,mod = this.child(this.now.module+"_"+this.now.action);

		if(module === this.now.module && action === this.now.action && mod){
			mod[method]();
			return false;
		}
		this.now.module = module;
		this.now.action = action;
		this.now.method = method;
		this.now.target = tag;

		require.async(module,onReach.bind(this));
	}
	/**
	 * 模块加载回调函数
	 * @param  {Object}    mod 模块对象
	 * @return {Undefined}     无返回值
	 */
	function onReach(mod){
		if(mod && mod[this.now.action]){
			mod = this.create(
				this.now.module+"_"+this.now.action
				,mod[this.now.action]
				,{
					"target":this.now.target
				}
			);
			if(mod[this.now.method]){
				mod[this.now.method]();
			}
		}else{
			console.error("模块阿卡林了！");
		}
	}

	function MainPage(config){
		config = $.extend(
			{
				"class":"P-main"
			}
			,config
		);
		this.doms = {};
		this.now = {};
		MainPage.master(this,null,config);
	}
	Extend(
		MainPage
		,view.container
		,{
			init:function(){
				MainPage.master(this,"init");
				this.build();
				// chrome.downloads.download(
				// 	{
				// 		url:"http://imgsrc.baidu.com/forum/cp%3Dtieba%2C10%2C1468%3Bap%3D%C9%BC%D4%…09b477094b36cfdf13a9caa91eb8/588375d0f703918fba1fcaa1503d269758eec437.jpg"
				// 		,filename:"test.jpg"
				// 		,saveAs:false
				// 	}
				// 	,function(id){
				// 		console.log('a');
				// 	}
				// );
				// test.build();
				// var tt = this.create(
				// 	"widget"
				// 	,t
				// 	,{
				// 		"store":{
				// 			"url":"/2ch/test/testdata.json"
				// 		}
				// 	}
				// );
				// window.widget = tt;
			}
			,build:function(){
				this.el.html(
					tpl.compile("main")
				);
				this.doms.lis = this.el.find("li[data-module]");

				this.doms.lis.bind("click",go.bind(this));
			}
		}
	);
	exports.page = MainPage;

});