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
	 * 图片抓取支援网站名称
	 * @type {Object}
	 * @private
	 */
	var IMGS_HOSTS_NAME_MAP = {
		"jk":"捷克"
		,"cl":"草榴"
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
			$("table[summary]:first td[id*='postmessage'] img,table[summary]:first ignore_js_op img").each(function(){
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
		,"www.yimuhe.com":/(.*)www\.yimuhe\.com\/(.*)/
		,"www.nyhx.com":/(.*)www\.nyhx.com\.com\/(.*)/
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

		// 子菜单状态
		this.menuStatus = 0;
		this.menuTimer = null;

		// 贴吧模块实例
		this.tieba = null;

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
	 * 切换密集阵
	 * @return {Undefined} 无返回值
	 */
	CP.togglePhalanx = function(){
		_phalanx.call(this);
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

	CP.tiebaSign = function(){
		if(this.tiebaSign && this.tiebaSign.tb_signing){
			LOG("正在签到，莫闹...","result");
			return;
		}
		this.tieba = new TiebaSign();
	}

	/**
	 * 贴吧签到
	 * @description 可以单独抽出来当插件
	 */
	function TiebaSign(){

		// 签到间隔
		this.delay = 3000;

		// 基础数据请求地址
		this.baseUrl = "http://tieba.baidu.com/";

		// 签到地址
		this.signUrl = "http://tieba.baidu.com/sign/add";

		// 贴吧列表
		this.tb_list = {};
		this.$tmpList = [];
		this.$failedList = [];

		// 验证ID
		this.tb_security_id = null;

		// 验证ID匹配正则，成功的话取最后一个再过字符匹配正则
		this.tb_security_id_exp = /PageData\.tbs(.*)\=(.*);/;
		this.tb_security_id_limit_exp = /\w+/;

		// 获取喜欢的贴吧列表
		this.tb_often_forum_exp = /_\.Module\.use\("spage\/widget\/OftenForum"(.*)\[\[(.*)\]\]\);/;

		// 狗日的服务端编码
		this.tb_often_kw_exp = /\/f\?kw=.*&fr=index&fp=[0|2]/ig;
		this.tb_often_kw_exp2 = /kw=(.*?)&/;
		this.$kw = [];

		// 喜欢的贴吧数量
		this.tb_len = 0;

		// 签到状态
		this.tb_signing = false;

		// 失败尝试次数
		this.tb_try = 3;

		// 开始
		this.init();
	}

	/**
	 * 初始化
	 * @return {Undefined} 无返回值
	 */
	TiebaSign.prototype.init = function(){
		if(this.tb_signing){
			return;
		}
		this.tb_signing = true;
		$.get(this.baseUrl)
			.done(function(re){
				if(this.getSecurityId(re)){
					this.getOftenForumList(re);
					this.doSign();
				}
				re = null;
			}.bind(this))
			.fail(function(re){
				LOG("Get base info failed.","error");
			});
	}

	/**
	 * 从页面字符串中获取验证ID
	 * @param  {String} htm 基础数据请求页面的字符串
	 * @return {Mix}        获取结果。null则表示获取失败
	 */
	TiebaSign.prototype.getSecurityId = function(htm){
		if(!htm){
			return;
		}
		var tmp = this.tb_security_id_exp.exec(htm);
		if(tmp){
			tmp = this.tb_security_id_limit_exp.exec(tmp.pop());
			tmp = tmp && tmp[0] || null;
			this.tb_security_id = tmp && tmp.length === 26 && tmp || null;
		}else{
			this.tb_security_id = null;
		}
		tmp = null;
		return this.tb_security_id;
	}

	/**
	 * 从页面字符串中获取喜欢的贴吧列表
	 * @param  {String} htm 基础数据请求页面的字符串
	 * @return {Mix}        获取结果。null则表示获取失败
	 */
	TiebaSign.prototype.getOftenForumList = function(htm){
		if(!htm){
			return;
		}
		var tmp = this.tb_often_forum_exp.exec(htm);
		tmp = tmp && JSON.parse("["+tmp.pop()+"]") || null;
		if(tmp){
			this.tb_len = tmp.length;
			this.tb_list = {};
			tmp.forEach(function(item,index){
				item = {
					"id":item.forum_id
					,"name":item.forum_name
					,"kw":item.forum_name
					,"sign":item.is_sign
				}
				this.tb_list[item.id] = item;
				if(!item.sign){
					this.$tmpList.push(item);
				}
			}.bind(this));
		}
		tmp = null;
		return this.tb_list;
	}

	/**
	 * 签到
	 * @return {Undefined} 无返回值
	 */
	TiebaSign.prototype.doSign = function(){
		if(!this.$tmpList){
			return;
		}
		_goSign.call(
			this
			,this.$tmpList.shift()
		);
	}

	/**
	 * 发起签到请求
	 * @param   {Object}    data 喜欢的贴吧数据
	 * @return  {Undefined}      无返回值
	 * @private
	 */
	function _goSign(data){
		$.post(
			this.signUrl
			,{
				"ie":"utf-8","kw":data.kw,"tbs":this.tb_security_id
			}
			,function(re){
				if(re.error){
					LOG(data.name+"|"+re.error,"result");
					// 失败时
					this.$failedList.push(data);
				}else{
					// 成功时
					this.tb_list[data.id].sign = 1;
				}
				_signNext.call(this);
			}.bind(this)
			,"json"
		);
	}

	/**
	 * 发起下一个签到请求
	 * @return  {Undefined}  无返回值
	 * @private
	 */
	function _signNext(){
		if(this.$tmpList.length){
			// 延时发送
			setTimeout(function(){
				this.doSign();
			}.bind(this),this.delay);
		}else{
			if(this.tb_try && this.$failedList.length){
				// 有尝试次数且有签到失败的
				this.tb_try -= 1;
				// 产生一个新的签到数组
				this.$tmpList = [].concat(this.$failedList);
				// 清空失败数组
				this.$failedList = [];
				LOG("预计于3秒后尝试重新签到...","result");
				_signNext.call(this);
			}else{
				if(this.$failedList.length){
					LOG("有些贴吧签到失败了...","result");
				}
				this.tb_signing = false;
			}
		}
	}

	function _bindMenu(){
		this.box.mBnts = this.box.menu.children("div");
		this.box.mBnts.bind("click",_menuHandler.bind(this));
	}

	function _menuHandler(ev){
		var type = $(ev.target).closest("div[data-type]").attr("data-type");
		switch(type){
			case "saveImg":
				this.getImg();
			break;

			case "custom":
				LOG("╮(╯▽╰)╭","result");
			break;

			case "tiebaSign":
				this.tiebaSign();
			break;

			case "togglePhalanx":
				this.togglePhalanx();
			break;
		}
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
			,type = IMGS_HOSTS_MAP[window.location.host]
			,fn = IMGS_SELECTORS[
				type
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
					,"typeName":IMGS_HOSTS_NAME_MAP[type]
					,"type":type
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
			this.box.menu = this.box.find(".functions");
			$("head").append(this.styleEl);
			this.show();
			_bindMenu.call(this);
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