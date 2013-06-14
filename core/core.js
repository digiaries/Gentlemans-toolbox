define(function(require,exports){

	var messager = require("messager")
		,util = require("util")
		,datacenter = require("datacenter");

	function isModule(obj){
		if (obj instanceof Object){
			var id = obj._ && obj._.guid || 0;
			return (id && caches[id] === obj);
		}
		return false;
	}
	util.isModule = isModule;

	// 空函数
	function noop(){}
	exports.noop = noop;

	// 类式继承功能函数
	function argv_run(ag, proto, scope, func, args){
		if (!func || !(func in proto)) {return undefined;}
		func = proto[func];
		if (typeof(func) != 'function') {return func;}
		var v = ag.callee.caller['arguments'];
		if (ag.length == 2){
			return func.apply(scope, v);
		}else if (args instanceof Array && args.length){
			return func.apply(scope, args);
		}else {
			return func.call(scope);
		}
	}
	// 模块自有公共属性和方法调用
	function mine_run(scope, func, args){
		return argv_run(arguments, this.prototype, scope, func, args);
	}
	// 私有对象属性设置
	function self_run(scope, func){
		var args = [];
		for (var i=2; i<arguments.length; i++){
			args.push(arguments[i]);
		}
		return argv_run(arguments, this.p, scope, func, args);
	}
	function Extend(sub,sup,proto,priv){
		function f(scope, func, args){
			if (scope === 0) {return this;}
			if (arguments.length === 0){
				return (sup == noop ? null : sup);
			}
			var v = arguments.callee.caller['arguments'];
			if (!func){
				return sup.call(scope, (args || v[0]), v[1], v[2]);
			}
			return argv_run(arguments, sup.prototype, scope, func, args);
		}
		f.prototype = sup.prototype;

		var n=0, o=sub.prototype;
		var c = sub.prototype = new f(0);

		for (n in o){
			if (o.hasOwnProperty(n)) {c[n] = o[n];}
		}
		if (typeof(proto) == 'object') {for (n in proto){
			if (proto.hasOwnProperty(n)) {c[n] = proto[n];}
		}}
		c.constructor = sub;
		sub.master = f;
		sub.self = self_run;
		sub.mine = mine_run;
		sub.p = priv;
		sub.version = exports.version;
		proto = null;
		return sub;
	}
	window.Extend = exports.Extend = Extend;

	/**
	 * 系统基础模块定义, 实现基础公用功能函数
	 * @param  {Object} config 模块初始化配置参数
	 * @param  {Object} parent 父模块实例对象
	 * @param  {Object} id     当前模块系统实例配置信息
	 * @return {Object}        返回创建的模块实例对象
	 *
	 * id参数具体属性说明
	 *   uri   @type {String}  模块实例的路径URI字符串
	 *   name  @type {String}  模块实例名称
	 *   pid   @type {Number}  父模块实例ID (GUID)
	 *   guid  @type {Number}  当前模块的实例ID (GUID)
	 */
	function Module(config, parent, id){
		return this;
	}
	var childs='childs',childs_name='childs_name',childs_id='childs_id';
	Extend(Module, noop, {
		/**
		 * 空模块判断函数
		 * @return {Boolean} 返回TRUE表示当前模块是虚拟空模块, FALSE表示为真实模块
		 */
		isNull: function(){
			return false;
		},
		/**
		 * 创建子模块实例
		 * @param  {String}   name   <可选> 子模块实例名称, 成为模块uri路径的一部分
		 * @param  {Function} type   子模块定义函数, 用于生成模块实例的函数
		 * @param  {Object}   config <可选> 传入模块创建函数的配置变量
		 * @return {Object}          返回创建的子模块实例, 创建失败时返回false
		 */
		create: function(name, type, config){
			if (!util.isModule(this)){
				exports.error('Current Module Invalid');
				return false;
			}

			if (!this._.hasOwnProperty(childs)){
				this._[childs] = []; // 子模块缓存列表
				this._[childs_name] = this.$ = {}; // 子模块命名索引
				this._[childs_id] = 0; // 子模块计数ID
			}
			if (util.isFunc(name)){
				if (util.isFunc(type)){
					name = name(this._);
				}else {
					config = type;
					type = name;
					name = null;
				}
			}
			if (!name){
				name = 'child_' + this._[childs_id];
			}else if (this._[childs_name][name]){
				exports.error('Module Name Exists');
				return false;
			}
			this._[childs_id]++;

			var id = {
				'uri': this._.uri + '/' + name,	// 模块实例路径
				'name': name,					// 模块实例名称
				'pid': this._.guid,				// 模块父模块实例ID
				'guid': caches.id++				// 当前子实例ID
			};
			var child = new type(config, this, id);
			child._ = id;
			// 存入全局Cache队列
			caches[id.guid] = child;
			caches.length++;
			// 存入子模块到父模块关系记录中
			this._[childs].push(child);
			this._[childs_name][name] = child;

			// 调用初始化方法
			if (util.isFunc(child.init)){
				child.init(config);
			}
			return child;
		},
		/**
		 * 获取当前模块的父模块对象
		 * @return {Object} 父模块对象, 没有则返回NULL
		 */
		parent: function(){
			if (!util.isModule(this) || this._.pid===0) {return null;}
			return (caches[this._.pid] || null);
		},
		/**
		 * 获取指定名称或者索引的子模块实例(仅限于该模块的子模块)
		 * @param  {String/Number}	name	子对象名称或数字索引
		 * @return {Object}					返回子对象实例 / 没有找到对象时返回NULL
		 */
		child: function(name){
			if (!util.isModule(this) || !this._[childs]) {return null;}
			if (!isNaN(name)){
				name = parseInt(name, 10);
				if (name < 0 || name >= this._[childs].length) {return null;}
				return this._[childs][name];
			}else {
				return (this._[childs_name][name] || null);
			}
		},
		/**
		 * 获取当前对象的所有子对象
		 * @param  {Bool}	by_name	<可选> 是否返回名字索引的对象列表
		 * @return {Object}			无子对象时, 返回一个空数组或NULL, 否则返回一个数组或者命名对象
		 */
		childs: function(by_name){
			if (!util.isModule(this) || !this._[childs]){
				return (by_name ? null : []);
			}
			return (by_name ? this._[childs_name] : this._[childs]);
		},
		/**
		 * 获取指定路径的实例
		 * @param  {String} uri 实例URI地址字符串, 使用 / 分隔层次, 每层可以是纯数字的子对象索引或对象名字
		 * @return {Object}     返回实例对象, 没有找到对应对象时, 返回NULL
		 */
		get: function(uri){
			if (!util.isString(uri)) {return null;}
			if (!uri) {return this;}
			if (uri.charAt(0) == '/') {return exports.core.get(uri);}

			var name;
			var obj = this;
			var ns = uri.split('/');
			while (ns.length){
				name = ns.shift();
				obj = (name == '..') ? obj.parent() : obj.child(name);
				if (!obj) {return obj;}
			}
			return obj;
		},
		/**
		 * 获取指定路径的多个实例, 星号匹配
		 * @param  {String} uri 实例URI地址字符串, 用 / 分隔, 可用*匹配部分实例名称
		 * @return {Array}      返回找到匹配的对象数组
		 */
		gets: function(uri){
			var name, list = arguments[1] || [];
			if (arguments[2] !== 1 && !util.isString(uri)) {return list;}

			// 空字符串, 返回当前对象
			if (!uri){
				list.push(this);
				return list;
			}

			// 纯数字属性, 返回对应索引的子实例
			if (!isNaN(uri)){
				name = this.child(uri);
				if (name) {list.push(name);}
				return list;
			}

			// 根节点查找
			if (uri.charAt(0) == '/') {return exports.core.gets(uri);}

			// 分离当前当前模块名称和子模块路径
			var ch = uri.indexOf('/');
			if (ch == -1){
				name = uri;
				uri = null;
			}else {
				name = uri.substr(0, ch);
				uri = uri.substr(ch+1);
			}

			if (name.indexOf('*') != -1){
				// 星号匹配名称
				var childs = util.isModule(this) && this._[childs_name];
				if (!childs) {return list;}
				var reg = util.starRegExp(name);
				for (name in childs){
					if (childs.hasOwnProperty(name) && reg.test(name)){
						ch = childs[name];
						if (uri){
							ch.gets(uri, list, 1);
						}else {
							list.push(ch);
						}
					}
				}
			}else {
				ch = (name == '..') ? this.parent() : this.child(name);
				if (ch){
					if (uri){
						ch.gets(uri, list, 1);
					}else {
						list.push(ch);
					}
				}
			}
			return list;
		},

		/**
		 * 冒泡方式发送消息
		 * @param  {String}   type     消息事件类型
		 * @param  {Object}   param    <可选> 消息事件参数, 附加在事件变量的param
		 * @param  {Function} callback <可选> 消息发送完成回调函数, 不填默认触发模块的onEventSent事件
		 * @param  {Object}   context  <可选> 回调函数运行域
		 * @return {Bool}              返回消息是否被立即发送
		 */
		fire: function(type, param, callback, context){
			if (param instanceof Function){
				context = callback;
				callback = param;
				param = null;
			}
			return MESSAGER.fire(this, type, param, callback, context);
		},
		/**
		 * 向下层子模块实例广播消息
		 * @param  {String}   type     消息事件类型
		 * @param  {Object}   param    <可选> 消息事件参数, 附加在事件变量的param
		 * @param  {Function} callback <可选> 消息发送完成回调函数, 不填默认触发模块的onEventSent事件
		 * @param  {Object}   context  <可选> 回调函数运行域
		 * @return {Bool}              返回消息是否被立即发送
		 */
		cast: function(type, param, callback, context){
			if (param instanceof Function){
				context = callback;
				callback = param;
				param = null;
			}
			return MESSAGER.broadcast(this, type, param, callback, context);
		},
		/**
		 * 向某个特定的模块实例发送消息
		 * @param  {Mix}    target 接受消息的模块实例或URI
		 * @param  {String} type   消息事件类型
		 * @param  {Object} param  <可选> 消息事件参数, 附加在事件变量的param
		 * @return {Object}        返回事件变量对象
		 */
		send: function(target, type, param){
			var mod = util.isModule(target) ? [target] : this.get(target);
			return MESSAGER.send(this, mod, type, param);
		},
		/**
		 * 绑定监听事件
		 * @param  {String}   type     监听事件类型
		 * @param  {Object}   data     <可选> 附加的监听数据
		 * @param  {Object}   listener <可选> 接收监听事件的模块实例
		 * @param  {Function} callback <可选> 事件回调函数(如果有listener时,可为字符串方法名)
		 * @param  {Object}   context  <可选> 回调事件执行的命名空间
		 * @return {Bool}              返回绑定状态结果
		 */
		bind: function(type, data, listener, callback, context){
			var argv = arguments, args = argv.length, arg;
			var param = new Array(5), i = 1;
			param[0] = argv[0];

			for (var j=1; j<args; j++){
				arg = argv[j];
				switch (i){
					case 1:
						if (util.isModule(arg)) {i=2; break;}
					/* falls through */
					case 2:
						if (util.isFunc(arg)) {i=3;}
					break;
					case 3:
						if (util.isString(arg)){
							arg = param[2] && param[2][arg];
							break;
						}
					/* falls through */
					case 4:
						if (!util.isObject(arg)) {i = 0;}
				}
				param[i++] = arg;
				if (i<1 || i>4) {break;}
			}
			if (!i){
				exports.error('bind param error!', argv);
				return false;
			}
			return MESSAGER.bind(param[2], this, param[0], param[3], param[1], param[4]);
		},
		/**
		 * 取消某个消息的处理函数
		 * @param  {String}   type     <可选> 取消取消绑定的事件类型
		 * @param  {Function} callback <可选> 需要取消绑定函数
		 * @return {Number}            返回取消的绑定数量
		 */
		unbind: function(type, callback){
			return MESSAGER.unbind(null, this, type, callback);
		},
		/**
		 * 监听某个实例对象的某种消息
		 * @param  {Mix}      uri      模块实例/URI字符串/数字
		 * @param  {String}   type     要监听的事件类型
		 * @param  {Object}   data     <可选> 附加的监听数据
		 * @param  {Function} callback <可选> 事件回调函数(如果有设置data参数, 可为字符串方法名)
		 * @param  {Object}   context  <可选> 回调事件执行的命名空间
		 * @return {Number}            返回成功绑定的事件数目(URI字符串时可*匹配实例对象)
		 */
		listen: function(uri, type, data, callback, context){
			//listener, sender, type, callback, data, context
			if (util.isFunc(data)){
				context = callback;
				callback = data;
				data = null;
			}else if (util.isString(callback)){
				callback = this[callback];
				if (!callback || !util.isFunc(callback)){
					exports.error('listen callback invalid');
					return false;
				}
			}
			var mods = util.isModule(uri) ? [uri] : this.gets(uri);
			var count = 0;
			while (mods.length){
				count += MESSAGER.bind(this, mods.shift(), type, callback, data, context) ? 1 : 0;
			}
			return count;
		},
		/**
		 * 取消监听某个实例对象的消息
		 * @param  {Mix}      uri      模块实例/URI字符串/数字
		 * @param  {String}   type     <可选> 要取消监听的事件类型
		 * @param  {Function} callback <可选> 要取消监听的事件处理函数(可为字符串方法名)
		 * @return {Number}            返回成功取消绑定的事件数目
		 */
		unlisten: function(uri, type, callback){
			var mods = (!uri || util.isModule(uri)) ? [uri] : this.gets(uri);
			if (util.isString(callback)){
				callback = this[callback];
			}
			var count = 0;
			while (mods.length){
				count += MESSAGER.unbind(this, mods.shift(), type, callback);
			}
			return count;
		},
		/**
		 * 绑定jQuery对象事件
		 * @param  {jQuery}   dom      jQuery DOM对象
		 * @param  {String}   type     监听的DOM事件名称
		 * @param  {Mix}      data     <可选> 回调事件的jQuery事件对象的data值
		 * @param  {Function} callback 事件回调的函数
		 * @return {Object}            支持链式调用, 返回模块实例
		 */
		jq: function(dom, type, data, callback){
			if (!dom){
				return this;
			}
			if (!dom.jquery){
				dom = $(dom);
			}
			if (util.isFunc(data) || arguments.length == 3){
				callback = data;
				data = null;
			}
			dom.bind(type, [this._.guid, callback, data], jqRouter);
			return this;
		},
		/**
		 * 代理jQuery对象事件
		 * @param  {jQuery}   dom      jQuery DOM对象
		 * @param  {String}   selector 要代理事件的jQuery选择器
		 * @param  {String}   type     监听的DOM事件名称
		 * @param  {Mix}      data     <可选> 回调事件的jQuery事件对象的data值
		 * @param  {Function} callback 事件回调的函数
		 * @return {Object}            支持链式调用, 返回模块实例
		 */
		dg: function(dom, selector, type, data, callback){
			if (!dom){
				return this;
			}
			if (!dom.jquery){
				dom = $(dom);
			}
			if (util.isFunc(data) || arguments.length == 4){
				callback = data;
				data = null;
			}
			dom.delegate(selector, type, [this._.guid, callback, data], jqRouter);
			return this;
		},

		/**
		 * 模块销毁函数
		 * @param  {Bool} silent <可选> 是否禁止发送销毁事件
		 * @return {Undefined}          无返回
		 */
		destroy: function(silent){
			// 调用自定义销毁前函数 (可进行必要的数据保存)
			if (this.beforeDestroy){
				try {
					this.beforeDestroy();
				}catch (err){
					exports.error('beforeDestroy() Exception!', err);
				}
			}

			// 由副模块调用销毁时, 默认禁止发送销毁消息
			if (!silent){
				this.fire('destroy');
			}

			// 销毁子模块
			var childs = this.childs();
			for (var i=0; i<childs.length; i++){
				if (childs[i].destroy) {childs[i].destroy(-1);}
			}

			// 取消所有绑定的监听事件
			this.unbind();
			this.unlisten();

			// 调用自定义销毁后函数 (可进行必要的界面销毁)
			if (this.afterDestroy){
				try {
					this.afterDestroy();
				}catch (err){
					exports.error('afterDestroy() Exception!', err);
				}
			}

			// 从父模块中删除 (递归调用时不用删除)
			if (silent !== -1){
				var parent = this.parent();
				if (parent) {parent.removeChild(this);}
			}

			// 销毁全局对象
			var guid = this._ && this._.guid || 0;
			if (caches.hasOwnProperty(guid)){
				delete(caches[guid]);
				caches.length--;
			}
		},
		/**
		 * 移除一个子模块实例
		 * @param  {Mix} child    子模块实例/子模块名称/子模块索引数字
		 * @return {Object}       返回移除的子模块实例对象 / 没有找到模块时返回NULL
		 */
		removeChild: function(child){
			var name, guid, i = 0;
			var list = this._[childs_name];
			var index = this._[childs];

			if (util.isModule(child)){
				guid = child._.guid;
			}else if (isNaN(child)){
				name = ''+child;
				if (list.hasOwnProperty(name)){
					guid = list[name]._.guid;
				}
			}else {
				i = parseInt(child, 10);
				if (i < 0 || i >= index.length) {return null;}
				guid = index[i]._.guid;
			}

			// 没有找到对应模块GUID
			if (!guid) {return null;}

			// 删除数组列表
			for (; i<index.length; i++){
				if (index[i]._.guid == guid){
					child = index[i];
					delete(this._[childs_name][child._.name]);
					index.splice(i, 1);
					return child;
				}
			}
			return null;
		},
		/**
		 * 过去模块数据 (默认直接返回子模块数据)
		 * @param  {Bool}   return_array 是否以数组方式整合数据结果
		 * @return {Object}              返回结果对象或数字结果
		 */
		getData: function(return_array){
			return this.getChildData(return_array);
		},
		/**
		 * 获取所有子模块数据
		 * @param  {Bool}   return_array 是否以数组方式整合数据结果
		 * @return {Object}              返回结果对象或数字结果
		 */
		getChildData: function(return_array){
			var list = this._[childs];
			if (list){
				var data = return_array ? [] : {};
				var id, value, empty = 1;
				for (var i=0; i<list.length; i++){
					id = return_array ? i : list[i]._.name;
					value = list[i].getData(return_array);
					if (value !== undefined){
						data[id] = value;
						empty = 0;
					}
				}
				return empty ? undefined : data;
			}
		},
		/**
		 * 循环调用模块重置(重写本函数建议调用父模块的该函数)
		 */
		reset: function(){
			var list = this._[childs];
			if (list){
				for (var i=0; i<list.length; i++){
					list[i].reset();
				}
			}
		}
	});
	exports.Module = Module;

	/**
	 * 系统实例缓存队列
	 * @type {HashList}
	 */
	var caches = exports.caches = {id:10, length:0};

	/**
	 * 应用核心模块
	 */
	function Core(){
		this._ = {
			uri: '',
			name: 'APP',
			parent: 0,
			guid: 1
		};
		caches['1'] = this;
		caches.length++;
	}
	Extend(Core, Module, {
		get: function(uri){
			uri = uri.replace(/^[\/]+/, '');
			return Core.master(this, 'get', [uri]);
		},
		gets: function(uri){
			uri = uri.replace(/^[\/]+/, '');
			return Core.master(this, 'gets', [uri]);
		},
		destroy: function(){
		}
	});

	/**
	 * 系统配置功能函数
	 * @param  {String} name    配置名称, 使用 / 分隔层次
	 * @param  {Mix}	value   不设为读取配置信息, null为删除配置, 其他为设置值
	 * @param  {Bool}   replace <可选> 强制覆盖值
	 * @return {Mix}            设置和删除操作是返回Bool表示操作状态, 读取是返回配置值
	 */
	function config(name, value){
		if (name instanceof Object){
			value = name;
			name = null;
		}
		var set = (value !== undefined);
		var remove = (value === null);
		var data;

		if (name){
			var ns = name.split('/');
			data = config.data;
			while (ns.length > 1 && (data instanceof Object) && data.hasOwnProperty(ns[0])){
				data = data[ns.shift()];
			}
			if (ns.length > 1){
				if (set) {return false;} // 设置值, 但是父层配置不存在
				if (remove)	{return true;} // 父层已经删除
				return undefined; // 值不存在, 不能获取
			}
			name = ns[0];
		}else if (remove){
			return false; // 根节点不能删除
		}else {
			data = config;
			name = 'data';
		}

		if (set){
			//TODO: 加入合并对象值的处理
			data[name] = value;
			return true;
		}else if (remove) {
			data[name] = null;
			delete(data[name]);
			return true;
		}else {
			return data[name];
		}
	}
	config.data = {};
	exports.config = config;

	/**
	 * 加载模块并回调
	 * @param  {String}   uri      模块地址
	 * @param  {Object}   param    <可选> 回调函数参数
	 * @param  {Function} callback 回调函数 / 实例模块
	 * @param  {Object}   context  <可选> 回调函数执行域 / 实例模块方法名称
	 * @return {None}            无返回
	 */
	function loadModule(uri, param, callback, context){
		var name, pos = uri.lastIndexOf('.');
		if (pos !== -1){
			name = uri.substr(pos + 1);
			uri = uri.substr(0, pos);
		}
		if (util.isFunc(param) || util.isModule(param)){
			context = callback;
			callback = param;
			param = null;
		}
		if (util.isModule(callback)){
			var cb = callback[context];
			if (util.isFunc(cb)){
				context = callback;
				callback = cb;
				cb = null;
			}
		}
		require.async(uri, function(mod){
			if (name){
				mod = mod[name];
			}
			if (!mod){
				// 加载模块失败或者模块属性不存在
				exports.error('loadModule Error! - '+ uri + (name ? '.'+name : ''));
			}else if (util.isFunc(callback)){
				callback.call((context || window), mod, param);
			}
			mod = name = pos = uri = param = callback = context = null;
		});
	}
	exports.loadModule = loadModule;

	/**
	 * 实例根节点
	 */
	var ROOT;
	var DATACENTER;
	var MESSAGER;
	/**
	 * 初始化应用对象, 可设置系统初始配置, 创建系统唯一对象实例
	 * @param  {Object}   conf     <可选> 初始化系统配置信息
	 * @param  {Function} callback <可选> 资源应用初始化完毕回调函数
	 * @return {Bool}              返回初始化状态是否成功
	 */
	exports.init = function(conf,callback){
		if (conf instanceof Object){
			config.data = conf;
		}
		MESSAGER = exports.msg = messager.init();
		DATACENTER = exports.data = datacenter.init(
			config("data/points")
			,config("data/max_query")
		);
		ROOT = exports.root = new Core();
		if(util.isFunc(callback)){
			callback.call(ROOT);
		}
		window.R = ROOT;
		window.util = util;
		return true;
	}

});