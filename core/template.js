define(function(require,exports){
	var $ = require("jquery");
	var cache = {}
		,base = "templates/";

	function loadFile(id){
		$.ajax({
			"url":base+id+".html"
			,"async":false
			,success:function(re){
				cache[id] = re;
			}
		});
	}

	function onSuccess(re){
		cache[id] = re;
	}

	function compile(id,data,callback){
		if(!cache[id]){
			loadFile(id);
		}
		return cache[id];
	}

	exports.compile = compile;

});