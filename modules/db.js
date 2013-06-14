(function(fn){
	if(typeof(define) === "function"){
		define(fn);
	}else{
		window.DataBase = fn();
	}
})(function(require, exports){

	function DataBase(config){
		this.config = util.extend(
			{}
			,config
		);

		// indexedDB
		this.IDB = window.indexedDB;

		// indexedDB Transaction
		this.IDBT = window.webkitIDBTransaction;

		// indexedDB KeyRange
		this.IDBK = window.webkitIDBKeyRange;

		// db.transaction
		this.DBT = null;

		// 数据库实例
		this.db = null;

		this.inited = false;

		this.init();
	}
	var DBP = DataBase.prototype;

	DBP.init = function(){
		if(!this.inited){

			var IDBRequest = this.IDB.open(
				this.config.dbname
				,this.config.version
			);
			IDBRequest.onerror = this.onError;
			IDBRequest.onsuccess = function(ev){
				this.db = IDBRequest.result;
				// this.DBT = this.db.transaction;
				if(this.config.callback){
					this.config.callback(ev);
				}
			}.bind(this);
			IDBRequest.onupgradeneeded = function(ev){
				this.db = ev.target.result;
				if(this.config.upgrade){
					this.config.upgrade(ev);
				}
			}.bind(this);
			this.inited = true;
		}else{
			console.log(">>>","...");
		}
	}

	DBP.chkStore = function(name){
		return this.db.objectStoreNames.contains(name);
	}

	DBP.createStore = function(conf){
		/*
		{
			"name":"test"
			,config:{
				//Store setting
				// primary key
				"keyPath":"email"
				// 是否自增
				,"autoIncrement":false
			}
			,"indexs":{
				"email":{
					"keyPath":"email"
					,"config":{}
				}
			}
			,"data":[]
		}
		 */

		if(this.db.objectStoreNames.contains(conf.name)){
			this.deletedStore(conf.name);
			console.log("[DB] The Older Store >>> ",conf.name,"has been deleted.");
		}

		// 创建store
		var store = this.db.createObjectStore(
			conf.name
			,conf.config
			,conf.config.autoIncrement
		);

		// 如果有索引配置
		if(conf.indexs){
			for(var n in conf.indexs){
				store.createIndex(
					n
					,conf.indexs[n].keyPath
					,conf.indexs[n].config
				);
			}
		}

		// 如果附带了数据
		if(conf.data){
			conf.data.forEach(function(item,index){
				store.add(item);
			});
		}

		return store;
	}

	DBP.deletedStore = function(name){
		if(name && this.db.objectStoreNames.contains(conf.name)){
			this.db.deleteObjectStore(name);
		}
	}

	DBP.onError = function(err){
		console.error(err);
	}

	DBP.add = function(conf){
		/*
		{
			"open":["a"]
			,"stores":{...}
			,complete:fun
			,process:fun
			,error:fun
		}
		 */
		var tran = this.db.transaction(conf.open,"readwrite")
			,store
			,data
			,storeConf
			,req
			,info = {};

		// @todo 事件绑定
		if(conf.complete){
			tran.oncomplete = function(re){
				conf.complete.call(this,info);
			}.bind(conf.context || tran);
		}

		tran.onerror = (
			conf.error && conf.error.bind(conf.context || tran) || this.onError
		);

		for(var n in conf.stores){
			store = tran.objectStore(n);
			storeConf = conf.stores[n];
			data = storeConf.data;
			info[n] = {"count":data.length};
			for(var i = 0,len = data.length;i<len;i++){
				if(store.get(data[i].url)){
					req = store.put(data[i]);
				}else{
					req = store.add(data[i]);
				}
				if(storeConf.process){
					req.onsuccess = storeConf.process.bind(storeConf.context || req);
				}
			}
		}
	}

	DBP.del = function(conf){
		if(_nogoodGoConf(conf)){
			return false;
		}
		conf.mode = "readwrite";
		conf.method = "delete";
		return this.go(conf);
	}

	DBP.get = function(conf){
		if(_chkGoConf(conf)){
			return false;
		}
		conf.method = "get";
		return this.go(conf);
	}

	DBP.go = function(conf){
		var req = this.db.transaction([conf.store],conf.mode || undefined)
			.objectStore(conf.store)[conf.method](conf.data);
		if(conf.success){
			req.onsuccess = conf.success.bind(conf.context || req);
		}
		req.onerror = (
			conf.error && conf.error.bind(conf.context || req) || this.onError
		);
		return req;
	}

	DBP.cursor = function(){

	}

	DBP.range = function(){

	}

	function _addEventListener(target,event,context){

	}

	function _nogoodGoConf(conf){
		return (typeof(conf) !== "object" || !conf.store || !conf.data)?true:false;
	}

	if(exports){
		exports.DataBase = DataBase;
	}else{
		return DataBase;
	}
});