define(function(require,exports){
	var Core = require("app")
		,view = require("view")
		,$ = require("jquery")
		,util = require("util");

	function Widget(config){
		this.config = $.extend(
			true
			,{
				// 添加区域
				"target":"body"
				// 数据获取设定
				,"store":{
					// 远程数据接口
					"url":"/"
					// 请求形式
					,"reqMethod":"get"
					// 请求参数
					,"param":null
					// 回调函数名
					,"callback":"onData"
				}
				// widget样式设定
				,"cls":"W-base"
				,"ui":null
				// 是否自动拉取数据
				,"autoLoad":true
			}
			,config
		);

		this.config.target = $(this.config.target);

		// 视图
		this.view = null;
		// 数据
		this.data = null;
	}
	Extend(
		Widget
		,Core.Module
		,{
			init:function(){
				// 界面先出
				this.build();
				// 如果开启了自动拉取
				if(this.config.autoLoad && util.has(this.config,"store.url")){
					this.load();
				}
			}
			/**
			 * 构造界面
			 * @return {Undefined} 无返回值
			 */
			,build:function(){
				if(this.config.target){
					this.view = this.create(
						"view"
						,view.container
						,{
							"target":this.config.target
							,"class":this.config.cls
						}
					);
				}else{
					console.warn(">>> No view here.",this);
				}
			}
			/**
			 * 重置模块
			 * @return {Object} 实例本身
			 */
			,reset:function(){
				this.data = {};
				this.view.destroy();
				this.build();
			}
			/**
			 * 获取数据
			 * @param {Mix} key 获取数据的索引。可以是字符串，数字，其他类型
			 * @return {Object} 数据
			 */
			,getData:function(){
				return this.data;
			}
			/**
			 * 设定数据
			 * @param {Object} data 数据
			 */
			,setData:function(data){
				this.data = data;
				this.cast(
					"widgetDataLoad"
					,{
						"data":this.data
					}
				);
			}
			/**
			 * 加载数据
			 * @param  {Object}    param 请求参数
			 * @return {Undefined}       无返回值
			 */
			,load:function(param,reParam){
				if(param){
					this.setParam(param);
				}
				var conf = this.config.store;
				Core.data[this.config.store.reqMethod](
					conf.url
					,conf.param
					,this
					,conf.callback
					,reParam
				);
			}
			/**
			 * 设定请求参数
			 * @param  {Object} param     新的参数对象
			 * @param  {Mix}    special   特殊操作。为布尔值且为真时会替换整个参数对象，为数组时将删除数组中的元素对应的key
			 * @return {Object}           新的参数对象
			 */
			,setParam:function(param,special){
				if(!param){
					return false;
				}
				var sParam = this.config.store.param;
				if(typeof(special) === "boolean" && special){
					sParam = param;
				}else{
					if(special && util.isArray(special) && special.length){
						special.forEach(function(item,index){
							delete sParam[item];
						});
					}
					sParam = $.extend(
						sParam
						,param
					);
				}
				this.config.store.param = param;
				return this.config.store.param;
			}
			/**
			 * 数据请求响应函数
			 * @param  {Object}    err  错误信息
			 * @param  {Object}    data 返回的数据对象
			 * @return {Undefined}      无返回值
			 */
			,onData:function(err,data,reParam){
				if(err){
					alert(err.code);
					return false;
				}
				this.setData(data);
			}
			/**
			 * 显示Widget
			 * @return {Object}  Widget实例
			 */
			,show:function(){
				this.view.show();
				return this;
			}
			/**
			 * 隐藏Widget
			 * @return {Object}  Widget实例
			 */
			,hide:function(){
				this.view.hide();
				return this;
			}
			/**
			 * 销毁函数
			 * @return {Undefined} 无返回值
			 */
			,destroy:function(){
				this.data = null;
				this.view.destroy();
				Widget.master(this,"destroy");
			}
		}
	);

	exports.base = Widget;

});