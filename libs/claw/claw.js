(function(fn){
	if(window.define){
		window.define(fn);
	}else{
		window.$ = fn();
	}
})(function(){
	var Version = "0.0.1";
	var BehindClaw
		,rquickExpr = /^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/
		,rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/
		,Claw = function(selector,context){
			return Claw.fin.init(selector,context,BehindClaw);
		};

	function _isString(str){
		return typeof(str) == 'string';
	}

	function _isFunc(func){
		return func instanceof Function;
	}

	function _isArray(val){
		return val instanceof Array;
	}

	function _isObject(val){
		return val instanceof Object;
	}

	/**
	 * 检测是否是纯Object对象
	 * @param  {Object}  obj 待检测对象
	 * @return {Boolean}     检测结果
	 * @private
	 */
	function _isPlainObject(obj) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// - DOM nodes
		// - window
		if ( !isObject(obj) || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		// Support: Firefox >16
		// The try/catch supresses exceptions thrown when attempting to access
		// the "constructor" property of certain host objects, ie. |window.location|
		try {
			if ( obj.constructor &&
					!core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
		} catch ( e ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	}

	Claw.fin = Claw.prototype = {
		"ver":Version
		,"selector":""
		,"length":0
		,init:function(selector,context){
			if(!selector){
				return this;
			}
			if(_isString(selector)){

			}else if(selector.nodeType){
				this.selector = this[0] = selector;
				this.length = 1;
				return this;
			}
		}
	}
	Claw.fin.init.prototype = Claw.fin;

	Claw.extend = Claw.fin.extend = function(){
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !_isFunc(target) ) {
			target = {};
		}

		// extend jQuery itself if only one argument is passed
		if ( length === i ) {
			target = this;
			--i;
		}

		for ( ; i < length; i++ ) {
			// Only deal with non-null/undefined values
			if ( (options = arguments[ i ]) != null ) {
				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && (_isPlainObject(copy) || (copyIsArray = _isArray(copy)) ) ) {
						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && _isArray(src) ? src : [];

						} else {
							clone = src && _isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[ name ] = Claw.extend( deep, clone, copy );

					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	return Claw;
});