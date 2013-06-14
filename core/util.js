(function(fn){
	if(typeof(define)=="function"){
		define(fn);
	}else{
		window.util = fn();
	}
})(function(require,exports){

	if(!window.define){
		exports = {};
	}

	// 变量类型判断
	function isFunc(func){
		return (func instanceof Function);
	}

	function isString(str){
		return (typeof(str) == 'string');
	}

	function isArray(val){
		return (val instanceof Array);
	}

	function isObject(val){
		return (val instanceof Object);
	}

	function starRegExp(str){
		str = str.replace(/([\$\.\^\(\)\[\]\{\}])/g, '\\$1');
		str = str.replace(/\*/g, '(?:.+)');
		return new RegExp(str);
	}

	function isCreator(func){
		if (!func || !func.master) { return false; }
		if (func.self !== self_run) { return false; }
		if (func.mine !== mine_run) { return false; }
		if (func.version !== exports.version) { return false; }
		return true;
	}

	// exports.isModule = isModule;
	exports.isCreator = isCreator;
	exports.isFunc = isFunc;
	exports.isString = isString;
	exports.isArray = isArray;
	exports.isObject = isObject;
	exports.starRegExp = starRegExp;


	function Has(Obj,value,keys){
		var re = false;
		if(isObject(Obj)){
			if(value.indexOf(".") !== -1){
				keys = value;
				keys = keys.split(".");
				keys.some(function(item,index){
					if(Obj){
						Obj = Obj[item];
					}else{
						Obj = null;
						return true;
					}
					return false;
				});
				re = Obj;
			}else{
				for(var n in Obj){
					if(Obj[n] === value){
						re = n;
						break;
					}
				}
			}
		}else if(isArray(Obj)){
			re = Obj.indexOf(value) !== -1;
		}
		value = keys = null;
		return re;
	}

	exports.has = Has;

	function UcFirst(str){
		if (isString(str)){
			var c = str.charAt(0).toUpperCase();
			return c + str.substr(1);
		}
		return str;
	}
	exports.ucFirst = UcFirst;

	function _extend(){
		var objs = arguments
			,re = {};
		for(var i=0,len = objs.length;i<len;i++){
			if(objs[i]){
				for(var n in objs[i]){
					re[n] = objs[i][n];
				}
			}
		}
		return re
	}

	exports.extend = _extend;

	if(!window.define){
		return exports;
	}

});