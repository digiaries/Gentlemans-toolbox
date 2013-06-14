(function(){

	/**
	 * util from util.js
	 */

	/**
	 * 界面注入的Html对象中主内容的ID
	 * @type {String}
	 * @private
	 */
	var BOXID = "THECEXSECTION_CLAW_CLIENT_BOX";

	/**
	 * 内置快捷命令
	 * @type {Object}
	 * @private
	 */
	var SP_CODE = {
		// »»IWANT
		"show":[187,187,73,87,65,78,84]
		// »»BYE
		,"hide":[187,187,66,89,69]
		// »»CLAW
		,"getImg":[187,187,67,76,65,87]
		// »»FIRE
		,"phalanxOn":[187,187,70,73,82,69]
		// »»HOLD
		,"phalanxOff":[187,187,72,79,76,68]
	};

	/**
	 * 图片抓取支援网站
	 * @type {Object}
	 * @private
	 */
	var IMGS_HOSTS_MAP = {
		// 草榴
		"184.154.128.246":"cl"
		// 捷克
		,"206.108.51.35":"jk"
	}

	/**
	 * 图片抓取结果
	 * @type {Array}
	 * @private
	 */
	var IMGS_RE;

	/**
	 * 图片抓取支援网站的特点抓取方法集
	 * @type {Object}
	 * @private
	 */
	var IMGS_SELECTORS = {
		cl:function(){
			IMGS_RE = [];
			$("input[type='image']").each(function(){
				IMGS_RE.push(
					$(this).attr("src")
				);
			});
		}
		,jk:function(){
			IMGS_RE = [];
			$("table[summary]:first td[id*='postmessage'] img").each(function(){
				IMGS_RE.push(
					$(this).attr("src")
				);
			});
		}
	}

	/**
	 * 最长命令字符数量限制
	 * @type {Number}
	 * @private
	 */
	var _MAX = 20;

	/**
	 * 密集阵的黑名单
	 * @type {Object}
	 * @private
	 */
	var BACK_LIST = {
		"www.400gb.com":/(.*)www\.400gb\.com\/(.*)/
	}

	function Claw(){

		this.ready = 0;
		// 注入对象
		this.injection = null;
		// 功能主控按钮
		this.box = null;
		// 是否处于激活状态
		this.arrival = 0;
		// 命令代码
		this.commCode = [];
		// 密集阵开启中LOL
		this.onFire = false;
		this.fireTimer = null;

		this.init();
	}

	var CP = Claw.prototype;

	/**
	 * 初始化
	 * @return {Undefined} 无返回值
	 */
	CP.init = function(){
		if(!this.ready){
			$.get(
				// 注入页面的模板
				chrome.runtime.getURL("templates/claw.html")
				,_init.bind(this)
				,"html"
			);
		}else{
			LOG(
				"别闹"
				,"result"
			);
		}
	}

	/**
	 * 密集阵开启
	 * @return {Undefined} 无返回值
	 */
	CP.phalanxOn = function(){
		if(!this.onFire){
			_phalanx.call(this);
		}
	}

	/**
	 * 密集阵关闭
	 * @return {Undefined} 无返回值
	 */
	CP.phalanxOff = function(){
		if(this.onFire){
			_phalanx.call(this);
		}
	}

	/**
	 * 检测输入的命令
	 * @return {Undefiend} 无返回值
	 */
	CP.chkComm = function(){
		var err = true;

		// 输出用户输入的命令
		LOG(String.fromCharCode.apply(this,this.commCode));

		// 检测跟执行
		if(_chkCommArr(this.commCode)){
			for(var n in SP_CODE){
				if(""+this.commCode === ""+SP_CODE[n]){
					this[n]();
					err = false;
					break;
				}
			}
		}
		if(err){
			// 挂了
			LOG(
				String.fromCharCode.apply(this,this.commCode)
				,"command error"
			);
		}
		this.commCode = [];
	}

	/**
	 * 模块事件绑定
	 * @return {Object} CP实例
	 */
	CP.bindEvent = function(){
		// 按键监控
		$(document).bind(
			"keyup"
			,_codeHandler.bind(this)
		);
		return this;
	}

	/**
	 * 显示控制栏
	 * @return {Object} CP实例
	 */
	CP.show = function(){
		if(!this.arrival){
			this.arrival = 1;
		}
		this.box.css("right","0");
		return this;
	}

	/**
	 * 隐藏控制栏
	 * @return {Object} CP实例
	 */
	CP.hide = function(){
		if(!this.arrival){
			return false;
		}
		this.box.css("right","-400px");
		return this;
	}

	/**
	 * 获取页面上的图片
	 * @return {Object} CP实例
	 */
	CP.getImg = function(){
		var re = []
			,fn = IMGS_SELECTORS[
				IMGS_HOSTS_MAP[window.location.host]
			];
		if(util.isFunc(fn)){
			// 有匹配的
			fn();
			LOG(
				"Images found and save to database."
				,"result"
			);
			// 保存起来
			_sendMsg(
				"saveImgUrls"
				,{
					"items":[].concat(IMGS_RE)
					,"title":document.title
					,"type":IMGS_HOSTS_MAP[window.location.host]
				}
			);
			// 清空结果
			IMGS_RE = [];
		}else{
			LOG("╮(╯▽╰)╭","result");
		}

		return this;
	}

	/**
	 * 消息发送函数
	 * @param  {String}     type 消息类型
	 * @param  {Mix}        data 消息数据
	 * @return {Undefined}       无返回值
	 */
	function _sendMsg(type,data){
		chrome.runtime.sendMessage(
			{
				"type":type
				,"data":data
			}
		);
	}

	/**
	 * 检测输入的命令的合法性
	 * @param  {Array} comm 命令代码数组
	 * @return {Bool}       检测结果
	 * @private
	 */
	function _chkCommArr(comm){
		return comm.length > 2 && comm[0] === 187 && comm[1] === comm[0];
	}

	/**
	 * 页面keyup事件响应函数
	 * @param  {Object} ev 事件消息对象
	 * @return {Undefined}    无返回值
	 * @private
	 */
	function _codeHandler(ev){
		if(this.commCode.length > _MAX && ev.keyCode !== 27){
			this.commCode = [];
			return true;
		}
		switch(ev.keyCode){
			// Enter
			case 13:
				this.chkComm();
			break;

			// Backspace
			case 8:
				this.commCode.pop();
			break;

			// Esc
			case 27:
				this.commCode = [];
			break;

			// Other
			default:
				this.commCode.push(ev.keyCode);
		}
	}

	/**
	 * 获取命令执行时间
	 * @return {String} 格式化后的时间字符串
	 * @private
	 */
	function _getLogTime(){
		var date = new Date();
		return "["+util.fix0((date.getHours()+1),2)+":"+util.fix0(date.getMinutes(),2)+":"+util.fix0(date.getSeconds(),2)+"]";
	}

	/**
	 * 初始化
	 * @return {Undefined} 无返回值
	 * @private
	 */
	function _init(re){
		// 初始化界面元素
		this.injection = $(re);

		$(function(){
			$("body:first").append(this.injection);
			this.styleEl = $("#"+BOXID+"_STYLE");
			this.box = $("#"+BOXID);
			$("head").append(this.styleEl);
		}.bind(this));

		// 绑定事件
		this.bindEvent();

		var tmp = BACK_LIST[window.location.host];
		tmp = tmp && tmp.exec(window.location.href);
		if(tmp && tmp[2]){
			this.phalanxOn();
		}
	}

	/**
	 * 密集阵
	 * @return {Undefined} 无返回值
	 * @private
	 */
	function _phalanx(){
		if(this.onFire && this.fireTimer){
			clearTimeout(this.fireTimer);
			this.fireTimer = null;
			this.onFire = false;
			LOG("Phalanx off");
		}else{
			this.fireTimer = setTimeout(function(){
				// 只处理BODY下的第一层元素
				$("body > a,body > div").each(function(){
					var tag = $(this);
					if(tag.css("zIndex")>200){
						tag.remove();
					}
					tag = null;
				});
				this.fireTimer = setTimeout(
					arguments.callee.bind(this)
					,300
				);
			}.bind(this),300);
			this.onFire = true;
			LOG("Phalanx on");
		}
	}

	/**
	 * 执行结果消息打印函数
	 * @param {Mix}    info 要打印的信息
	 * @param {String} type 执行类型
	 * @private
	 */
	function LOG(info,type){
		type = type || "command";
		type = type.toUpperCase()
		console.log(
			_getLogTime()
			,"["+type+"]"
			,info
		);
	}

	var claw = new Claw();
	// @todo 就算这么写，window下也不存在____CEX_CLAW。怎么破？
	window.____CEX_CLAW = claw;
})()