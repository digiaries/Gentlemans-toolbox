(function(){
	var APP;
	/*
	右键菜单
	chrome.runtime.onInstalled.addListener(function(){
		chrome.contextMenus.create({
			"title":"顺走"
			,"id":"saveImgUrls"
			,"contexts":['all']
			,onclick:onClickHandler
		});
		// chrome.contextMenus.onClicked.addListener(onClickHandler);
	});
	*/
	/**
	 * 右键菜单点击响应函数
	 * @param  {Object}    info 页面信息
	 * @param  {Object}    tab  选项卡页面信息
	 * @return {Undefined}      无返回值
	 * @deprecated              暂时弃用。
	 */
	function onClickHandler(info,tab){
		chrome.extension.sendMessage(
			{
				"type":"getImg"
				,"data":{
					"url":tab.url
					,"title":tab.title
				}
			}
		);
		/*chrome.runtime.sendMessage(
			{
				"type":"getImg"
				,"data":{
					"url":tab.url
					,"title":tab.title
				}
			}
		);*/
	};
	/**
	 * 插件消息监听
	 * @param  {Object}    req          消息请求对象
	 * @param  {Object}    sender       消息发送者相关信息对象
	 * @param  {Object}    sendResponse 消息回调函数
	 * @return {Undefined}              无返回值
	 * @todo  确认sender跟sendResponse的正确用法
	 */
	chrome.runtime.onMessage.addListener(function(req,sender,sendResponse){
		switch(req.type){
			case "saveImgUrls":
				APP.saveImgUrls(req.data);
			break;

			case "test":
				console.log("Off.");
			break;
		}
	});

	// 启用应用
	window.APP = APP = new Core();

})();