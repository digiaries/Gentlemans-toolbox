define(function(require, exports){
	function Build(){
		chrome.contextMenus.create({
			"title":"顺走"
			// ,"type":"radio"
			,"onclick":onClickHandler
			,"id":"getImg"
		});
		// chrome.contextMenus.onClicked.addListener(onClickHandler);
	}
	function onClickHandler(info,tab) {

		console.log("item " + info.menuItemId + " was clicked");
		console.log("info: " + info);
		console.log("tab: " + tab);

	};
	exports.build = Build;
});