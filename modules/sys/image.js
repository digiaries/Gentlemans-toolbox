define(function(require,exports){
	var Core = require("app")
		,$ = require("jquery");

	function PagePreview(config){

		this.config = $.extend(
			{
				"target":null
			}
			,config
		);

		this.el = null;
		this.injected = {};
		if(this.config.target){
			this.el = $(this.config.target);
		}
	}
	Extend(
		PagePreview
		,Core.Module
		,{
			init:function(){
			}
			,hide:function(){
				chrome.tabs.getSelected(null,function(tab){
					chrome.tabs.executeScript(
						tab.id
						,{
							"code":'__CHROME_EXTENDSION_PREVIEW = 0;'
						}
					);
				});
				this.el.addClass("act");
			}
			,show:function(){
				chrome.tabs.getSelected(null,function(tab){
					chrome.tabs.executeScript(
						tab.id
						,{
							"code":'__CHROME_EXTENDSION_PREVIEW = 1;'
						}
					);
				});
				this.el.addClass("act");
			}
		}
	);

	exports.preview = PagePreview;

});