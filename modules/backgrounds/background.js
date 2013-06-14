/**
 * @deprecated
 */
var DB = new DataBase({

});

chrome.runtime.onInstalled.addListener(function(){

	DB.createTable({
		"name":"imgrecord"
		,"cols":{
			"timestamp":"INTEGER"
			,"time":"INTEGER"
			,"title":"TEXT"
			,"url":"TEXT"
		}
	});
	// chrome.contextMenus.create({
	// 	"title":"顺走"
	// 	// ,"type":"radio"
	// 	,"id":"getImg"
	// });
	// chrome.contextMenus.onClicked.addListener(onClickHandler);
});

function onClickHandler(info,tab){
	chrome.runtime.sendMessage(
		{
			"type":"getImg"
			,"data":{
				"url":tab.url
				,"title":tab.title
			}
		}
	);
};

chrome.runtime.onMessage.addListener(function(req,sender,sendResponse){
	switch(req.type){
		case "getImg":
			xhrLoader({
				"url":"http://plugin.dev/proxy/port.php"
				,"data":{
					"url":"/cl/htm_data/16/1305/904009.html"
					,"title":req.data.title
				}
				,success:function(re){
					notifi({
						"title":"记录成功"
						,"msg":"本次共记录"+re.result.length+"张图片"
					});
					_saveImgRecordToDB(re.result.items,re.result.title);
				}
			});
		break;
	}
});

function _saveImgRecordToDB(rec,title){
	var rows = []
		,t = Math.floor(Date.now()/1000);
	for(var i =0,len = rec.length;i<len;i++){
		DB.insert({
			"name":"imgrecord"
			,"params":[Date.now()+i,t,title,rec[i]]
			,"cols":["timestamp","time","title","url"]
		});
	}
}

function notifi(config){
	config = config || {};
	var notification = webkitNotifications.createNotification(
		"/resources/images/48.png"
		,config.title || "提示"
		,config.msg || "开玩笑吧。。。"
	);
	notification.show();
}

function paramer(data){
	var param = [];
	for(var n in data){
		param.push(
			n+"="+data[n]
		);
	}
	return param.join("&");
}

function xhrLoader(conf){
	var xhr = new XMLHttpRequest;
	var query = "?_="+Date.now()+"&";

	if(conf.data){
		query += paramer(conf.data);
	}

	xhr.open(conf.type||"GET",conf.url+query,true);
	conf.setRequestHeader && xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4){
			if(xhr.status === 200 && conf.success){
				conf.success(JSON.parse(xhr.responseText));
			}else if(xhr.status !== 200 && conf.error){
				conf.error(xhr.status,xhr.responseText)
			}
		}
	};
	conf.progress && xhr.addEventListener("progress",conf.progress,!1);
	xhr.send(null);
	return xhr;
}