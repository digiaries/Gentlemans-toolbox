(function(){
	function noop(){};

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
		sub.version = Config("version");
		proto = null;
		return sub;
	}

	function Module(config,parent,id){
	}
	Extend(
		Module
		,noop
	);
	var caches = {
		"id":10
		,"length":0
	};
	window.Cache = caches;
	var DB;
	function Core(){
		this._ = {
			uri: '',
			name: 'APP',
			parent: 0,
			guid: 1
		};
		caches['1'] = this;
		caches.length++;
		this.init();
	}
	Extend(
		Core
		,Module
		,{
			init:function(){
				this.funcsConfig = Config("funcs");
				var tmp = Config("db");
				DB = this.DB = new DataBase(
					util.extend(
						{
							"dbname":tmp.dbname
							,"version":tmp.version
							,upgrade:_chkDB.bind(this)
						}
					)
				);
				tmp = null;
			}
			/**
			 * 保存图片到数据库
			 * @param  {Object}    data 数据对象
			 * @return {Undefined}      无返回值
			 */
			,saveImgUrls:function(data){
				_saveImgRecordToDB.call(
					this
					,data.items
					,data.title
					,data.type
					,data.typeName
				);
			}
			/**
			 * 获取保存在数据库中的所有图片
			 * @param  {Function}  callback 回调函数
			 * @return {Undefined}          无返回值
			 */
			,getRecordedImg:function(callback){
				// if(!this.DB.db){
				// 	return false;
				// }
				var dbName = this.funcsConfig.imgs.exDb
					,objectStore = this.DB.db.transaction([dbName]).objectStore(dbName)
					,result = [];
				objectStore.openCursor().onsuccess = function(ev){
					var cursor = ev.target.result;
					if(cursor){
						result.push(cursor.value);
						cursor.continue();
					}else{
						if(callback){
							callback(result);
						}
					}
				}
			}
			/**
			 * 按索引删除记录的图片
			 * @param  {String}      index    图片索引类型
			 * @param  {String}      key      匹配的键值
			 * @param  {Function}    callback 回调函数
			 * @return {Undefined}            无返回值
			 */
			,delRecordedImgByIndex:function(index,key,callback){
				var dbName = this.funcsConfig.imgs.exDb
					,objectStore = this.DB.db.transaction([dbName],"readwrite").objectStore(dbName)
					,sdIndex = objectStore.index(index)
					,result = 0
				sdIndex.openKeyCursor(key).onsuccess = function(evt){
					var cursor = evt.target.result;
					if(cursor){
						objectStore.delete(cursor.primaryKey).onsuccess = function(event){
							result += 1;
						}
						cursor.continue();
					}else{
						if(callback){
							callback(result);
						}
					}
				}
			}
			,moveToPostDbByKey:function(data,key,callback){
				var dbName = this.funcsConfig.imgs.exDb
					,objectStore = this.DB.db.transaction([dbName],"readwrite").objectStore(dbName)
					,sdIndex = objectStore.index("key")
					,urls = [];
				data.forEach(function(item){
					urls.push(item.url);
				});
				sdIndex.openKeyCursor(key).onsuccess = function(evt){
					var cursor = evt.target.result;
					if(cursor && urls.indexOf(cursor.primaryKey) !== -1){
						objectStore.delete(cursor.primaryKey);
						cursor.continue();
					}
				}

				dbName = this.funcsConfig.imgs.posted;
				var stores = {
					"open":[dbName]
					,"stores":{}
					,complete:function(re){
						if(callback){
							callback();
						}
					}.bind(this)
				}
				stores.stores[dbName] = {"data":data};
				this.DB.add(stores);
			}
			/**
			 * 序列化参数
			 * @param  {Object} data 参数对象
			 * @return {String}      参数字符串
			 */
			,paramer:function(data){
				var param = [];
				for(var n in data){
					param.push(
						n+"="+data[n]
					);
				}
				return param.join("&");
			}
			/**
			 * ajax请求方法
			 * @param  {Object} conf ajax请求配置参数对象
			 * @return {Object}      ajax请求对象
			 */
			,ajax:function(conf){
				var xhr = new XMLHttpRequest;
				var query = "?_="+Date.now()+"&";
				conf.context = conf.context || this;
				if(conf.data){
					query += this.paramer(conf.data);
				}

				xhr.open(conf.type||"GET",conf.url+query,true);
				conf.setRequestHeader && xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				xhr.onreadystatechange = function(){
					if(xhr.readyState === 4){
						if(xhr.status === 200 && conf.success){
							conf.success.call(conf.context,JSON.parse(xhr.responseText));
						}else if(xhr.status !== 200 && conf.error){
							conf.error.call(conf.context,xhr.status,xhr.responseText)
						}
					}
				};
				conf.progress && xhr.addEventListener("progress",conf.progress,!1);
				xhr.send(null);
				return xhr;
			}
			/**
			 * 浏览器桌面提示
			 * @param  {Object}    conf  提示信息配置对象
			 * @param  {Number}    delay 自动隐藏时间。0~100则不自动隐藏，默认2000ms
			 * @return {Undefined}       无返回值
			 */
			,notice:function(conf,delay){
				conf = conf || {};
				delay = delay === undefined ?2000:delay;
				var notification = webkitNotifications.createNotification(
					"/resources/images/dajie.png"
					,conf.title || "提示"
					,conf.msg || "开玩笑吧。。。"
				);
				notification.show();
				if(delay){
					setTimeout(function(){
						notification.cancel();
					},delay);
				}
			}
			,test:function(){

			}
		}
	);

	/**
	 * 数据库监测函数
	 * @param  {Object}    ev 数据库变动事件对象
	 * @return {Undefined}    无返回值
	 */
	function _chkDB(ev){
		if(!this.DB.chkStore(this.funcsConfig.imgs.exDb)){
			_initDB.call(this);
		}
		// @todo 已存在的话需要检测表
		// @todo 增删了表怎么办？
	}

	/**
	 * 初始化数据库
	 * @return {Undefined} 无返回值
	 */
	function _initDB(){
		var stores = Config("db.structure")
			,store;
		for(var n in stores){
			store = stores[n];
			store.name = n;
			this.DB.createStore(store);
		}
	}

	var REGEXP = {
		"host":/^((\w+):\/\/)?([^\/\?:]+)?(\/?[^\?#]+)/
	}

	/**
	 * 保存至数据库
	 * @param  {Array}     rec       要保存的数据数组
	 * @param  {String}    title     页面标题
	 * @param  {String}    type      所属网站
	 * @param  {String}    typeName  所属网站名称
	 * @return {Undefined}           无返回值
	 */
	function _saveImgRecordToDB(rec,title,type,typeName){
		var dbName = this.funcsConfig.imgs.exDb;
		var stores = {
				"open":[dbName]
				,"stores":{}
				,complete:function(re){
					this.notice({
						"title":"记录成功"
						,"msg":"本次共记录"+re[this.funcsConfig.imgs.exDb].count+"张图片"
					});
				}.bind(this)
			}
			,data = []
			,key
			,time = util.date("Y-m-d",new Date());

		stores.stores[dbName] = {"data":null};

		// 用标题加时间生成一个Key用以代替标题做索引
		// @todo 或者用其他的？
		key = util.encode64(
			util.strUnicode2Ansi(title.substr(0,10)+time)
		);
		for(var i =0,len = rec.length;i<len;i++){
			data.push({
				"timestamp":Date.now()+i
				,"time":time
				,"title":title
				,"url":rec[i]
				,"type":type
				,"key":key
				,"typeName":typeName
			});
		}

		stores.stores[dbName].data = data;
		this.DB.add(stores);

		stores = time = data = time = rec = key = null;
	}

	window.Core = Core;
	window.Module = Module;
	window.Extend = Extend;
})()