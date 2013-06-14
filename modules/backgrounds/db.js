(function(){
	/**
	 * @deprecated
	 */
	function DataBase(config){
		this.config = util.extend(
			{
				"shortName":"NDB"
				,"version":"0.1"
				,"displayName":"New Database"
				,"maxSize":65536
			}
			,config
		);
		this.db = null;
		this.data = {
			output:null
		};
		this.init();
	}
	var DBP = DataBase.prototype;
	DBP.init = function(){
		this.db = openDatabase(
			this.config.shortName
			,this.config.version
			,this.config.displayName
			,this.config.maxSize
		);
	}
	DBP.query = function(conf){
		_transaction.call(
			this
			,[conf]
		);
	}
	DBP.createTable = function(conf){
		this.query({
			"query":"CREATE TABLE IF NOT EXISTS "+conf.name+" ("+_getQueryCols(conf.cols)+");"
		});
	}
	DBP.insert = function(conf){
		this.query({
			"query":'INSERT INTO '+(conf.name+(conf.cols && ("("+conf.cols.join()+")") || ""))+" values("+_getQos(conf.params.length)+")"
			,"params":conf.params
		});
	}
	DBP.multipleInsert = function(conf){
		var q = 'INSERT INTO '+(conf.name+(conf.cols && ("("+conf.cols.join()+")") || ""))+" values "
			,vs=[];

		for(var i =0,len = conf.rows.length;i<len;i++){
			vs.push("("+conf.rows[i]+")");
		}
		q += vs;
		vs = null;
		notification = webkitNotifications.createNotification(
		"/resources/images/48.png"
		,"提示"
		,q
	).show();
		this.query({
			"query":q
		});
	}

	function _transaction(execs,next){
		this.db.transaction(function(tran){
			execs.forEach(function(item){
				tran.executeSql(
					item.query
					,item.params
					,function(txs,result){
						var res = [];
						if(result && result.rows.length){
							for(var i = 0,len = result.rows.length;i<len;i++){
								res.push(result.rows.item(i));
							}
						}
						item.callback && item.callback(res);
					}
					,_error
				);
			});
		});
	}

	function _error(txs,error){
		console.warn({
			"txs":txs
			,"error":error
		});
	}

	function _getQueryCols(cols){
		var _cols = [];
		for(var n in cols){
			_cols.push(n+" "+cols[n]);
		}
		_cols = ""+_cols;
		return _cols;
	}

	function _getQos(len){
		var qos = [];
		for(var i=0;i<len;i++){
			qos.push("?");
		}
		return ""+qos;
	}

	window.DataBase = DataBase;
})()