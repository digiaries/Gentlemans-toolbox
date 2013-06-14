define(function(require,exports){
	var Core = require("app")
		,$ = require("jquery");
	function Preview(config){

		this.config = $.extend(
			{
				"target":null
			}
			,config
		);

		this.el = null;

		if(this.config.target){
			this.el = $(this.config.target);
		}
	}
	Extend(
		Preview
		,Core.Module
		,{
			init:function(){
			}
			,show:function(){
				chrome.tabs.create({
					"url":chrome.runtime.getURL("pages/previewpage.html")
					,"active":true
				});
				this.el.addClass("act");
			}
		}
	);

	exports.base = Preview;
});