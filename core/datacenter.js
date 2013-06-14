define(function(require,exports){
	var util = require("util")
		,$ = require("jquery");
	/**
	 * 数据中心内部实例
	 * @type {DataCenterObject}
	 */
	var DATACENTER = null;
	/**
	 * 数据中心处理实例定义
	 */
	function DataCenter(list,max_query){
		this.entries = [];
		// 读取系统配置数据节点
		// var list = config('data/points');
		if (list){
			var key, val, kf, vf;
			for (key in list){
				val = list[key];
				if (key.charAt(0) != '/'){
					key = '/' + key;
				}
				kf = (key.substr(-1) == '/');
				vf = (val.substr(-1) == '/');
				if (!kf && vf){
					key += '/';
				}
				if (!vf && kf){
					val += '/';
				}
				this.entries.push({
					'point': key,
					'url': val
				});
			}
			// 排序节点
			this.entries.sort(function(a,b){
				if (a.point.length == b.point.length){
					return (a.point > b.point);
				}else {
					return (a.point.length <= b.point.length);
				}
			});
		}

		// 请求队列
		this.queue = {};
		// 同时请求数
		this.max = max_query || 5;
		// 当前请求数
		this.current = 0;
		// 请求序号
		this.id = 1;
	}

	var dcID=0, dcMode=1, dcURI=2, dcData=3, dcParam=4, dcCallback=5, dcContext=6, dcAjax=7, dcAbort=8, dcEvtDat=9;
	DataCenter.prototype = {
		/**
		 * ajax回调函数 / 错误处理用作输出回调(type设为'error')
		 * @param  {Mix}    data ajax返回对象 / 错误对象
		 * @return {None}        无返回
		 */
		onSuccess: function(data){
			DATACENTER.next(this);

			// 回调通知方法
			var cb = this[dcCallback], ctx = this[dcContext];
			if (cb){
				// 处理数据结构
				var error = null;
				if (data && data.success) {
					data = data.result;
				}else {
					error = data || {success:false, message:LANG('服务器返回信息无效'), code:-10};
					data = null;
				}

				// 回调数据接口
				if (util.isModule(cb)){
					if (!ctx || !util.isFunc(cb[ctx])){
						ctx = cb.onData || null;
					}else {
						ctx = cb[ctx];
					}
					if (ctx){
						ctx.call(cb, error, data, this[dcEvtDat]);
					}
				}else if (util.isFunc(cb)){
					cb.call(ctx || window, error, data, this[dcEvtDat]);
				}
			}
		},
		/**
		 * Ajax错误回调函数
		 * @param  {Object} xhr  jQuery XmlRequest对象
		 * @param  {String} text 错误信息
		 * @param  {String} err  错误描述
		 * @return {None}        无返回
		 */
		onError: function(xhr, text, err){
			if (this[dcAbort]) {return;}
			var error = {
				success: false,
				message: err,
				code: xhr.status
			};
			if (xhr.status && err !== ''){
				DATACENTER.onSuccess.call(this, error);
			}else {
				DATACENTER.next(this);
			}
		},
		/**
		 * 完成一个请求, 并继续发起一个新的请求
		 * @param  {Object}   request 当前要完成的请求对象
		 * @return {None}             无返回
		 */
		next: function(request){
			// 从请求队列中移除当前请求
			var list = this.queue;
			var id = request[dcID];
			this.current--;
			delete(list[id]);

			// 检索出最先进入等待的请求并发起
			for (id in list){
				if (!list.hasOwnProperty(id)) {continue;}
				if (list[id][dcAjax]) {continue;}
				this.execute(list[id]);
				break;
			}
		},
		/**
		 * 执行一个请求
		 * @param  {Object} request 请求对象
		 * @return {None}           无返回
		 */
		execute: function(request){
			// 转换uri节点
			var uri = this.resolve(request[dcURI], request[dcParam]);

			request[dcAjax] = $.ajax({
				type: request[dcMode],
				url: uri,
				data: request[dcData] && JSON.stringify(request[dcData]),
				dataType: 'json',
				success: this.onSuccess,
				error: this.onError,
				// complete: this.onComplete,
				context: request
			});

			this.current++;
		},
		/**
		 * 建立一个请求
		 * @param  {String}   mode     请求方法
		 * @param  {String}   uri      请求URL地址(会被系统绑定节点替换为正确地址)
		 * @param  {Mix}      data     字符串或对象, 需要POST到服务器端的内容
		 * @param  {Object}   param    GET方式的URL请求参数
		 * @param  {Mix}      callback 回调函数 / 模块实例对象
		 * @param  {Mix}      context  回调函数的运行域 / 模块实例对象的回调函数名字符串
		 * @param  {Mix}      evt_data 回调函数附带参数
		 * @return {Number}            返回请求记录ID
		 */
		run: function(mode, uri, data, param, callback, context, evt_data){
			if (util.isFunc(param) || util.isModule(param)){
				evt_data = context;
				context = callback;
				callback = param;
				param = null;
			}

			// 放入请求队列
			var id = this.id++;
			var req = [
				id, mode, uri,
				(data || null),
				(param || null),
				(callback || null),
				(context || null),
				null,
				false,
				evt_data
			];
			this.queue[id] = req;

			// 判断是否有空余请求数运行请求
			if (this.current < this.max){
				this.execute(req);
			}
			return id;
		},

		/**
		 * 解析数据节点地址
		 * @param  {String} uri 要解析的URI地址字符串
		 * @param  {Object} param <可选> 附加的GET参数对象
		 * @return {String}     返回解析后的URI字符串
		 */
		resolve: function(uri, param){
			var list = this.entries;
			for (var i=0; i<list.length; i++){
				if (uri.indexOf(list[i].point) === 0){
					uri = list[i].url + uri.substr(list[i].point.length);
					break;
				}
			}
			// 合并param参数到URI中
			if (param){
				uri += (uri.indexOf('?') > 0 ? '&' : '?');
				if (util.isObject(param)){
					uri += $.param(param)
				}else {
					uri += param;
				}
			}
			return uri;
		},
		/**
		 * 请求获取服务器资源
		 * @param  {String}   uri      请求URL地址(会被系统绑定节点替换为正确地址)
		 * @param  {Object}   param    GET方式的URL请求参数
		 * @param  {Mix}      callback 回调函数 / 模块实例对象
		 * @param  {Mix}      context  回调函数的运行域 / 模块实例对象的回调函数名字符串
		 * @param  {Mix}      evt_data 回调函数附带参数
		 * @return {Number}            返回请求记录ID
		 */
		get: function(uri, param, callback, context, evt_data){
			return this.run('GET', uri, null, param, callback, context, evt_data);
		},
		/**
		 * 提交数据到服务器
		 * @param  {String}   uri      请求URL地址(会被系统绑定节点替换为正确地址)
		 * @param  {Mix}      data     字符串或对象, 需要POST到服务器端的内容
		 * @param  {Object}   param    GET方式的URL请求参数
		 * @param  {Mix}      callback 回调函数 / 模块实例对象
		 * @param  {Mix}      context  回调函数的运行域 / 模块实例对象的回调函数名字符串
		 * @param  {Mix}      evt_data 回调函数附带参数
		 * @return {Number}            返回请求记录ID
		 */
		put: function(uri, data, param, callback, context, evt_data){
			return this.run('POST', uri, data, param, callback, context, evt_data);
		},
		/**
		 * 请求删除服务器资源
		 * @param  {String}   uri      请求URL地址(会被系统绑定节点替换为正确地址)
		 * @param  {Object}   param    GET方式的URL请求参数
		 * @param  {Mix}      callback 回调函数 / 模块实例对象
		 * @param  {Mix}      context  回调函数的运行域 / 模块实例对象的回调函数名字符串
		 * @param  {Mix}      evt_data 回调函数附带参数
		 * @return {Number}            返回请求记录ID
		 */
		del: function(uri, param, callback, context, evt_data){
			return this.run('DELETE', uri, null, param, callback, context, evt_data);
		},
		/**
		 * 终止一个请求或所有请求
		 * @param  {Number} id <可选> 要终止的请求ID
		 * @return {Number}    返回终止的请求数目
		 */
		abort: function(id){
			var request;
			if (id){
				request = this.queue[id];
				if (!request) {return 0;}
				if (request[dcAjax]){
					request[dcAbort] = true;
					request[dcAjax].abort();
					this.current--;
				}
				delete(this.queue[id]);
				return 1;
			}else {
				var count = 0;
				for (id in this.queue){
					if (!this.queue.hasOwnProperty(id)) {continue;}
					this.abort(id);
					count++;
				}
				return count;
			}
		}
	};

	exports.init = function(list,max_query){
		if(!DATACENTER){
			DATACENTER = new DataCenter(list,max_query);
		}
		return DATACENTER;
	};
});