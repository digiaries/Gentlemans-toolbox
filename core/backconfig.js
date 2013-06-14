(function(){

	var CONFIG = {
		// 数据库配置
		"db":{
			"dbname":"Pu"
			,"version":2
			,"structure":{
				"imgrecord":{
					"config":{
						"keyPath":"url"
						,"autoIncrement":false
					}
					,"indexs":{
						"type":{
							"keyPath":"type"
							,"config":{
								"unique":false
							}
						}
						,"timestamp":{
							"keyPath":"timestamp"
							,"config":{
								"unique":true
							}
						}
						,"time":{
							"keyPath":"time"
							,"config":{
								"unique":false
							}
						}
					}
				}
			}
		}
		// 右键菜单配置
		,"contextMenus":[]
		// 功能函数固定配置
		,"funcs":{
			"getImg":{
				"hostMap":{
					"184.154.128.246":"cl"
				}
			}
		}
		// 插件版本
		,"version":"2013.3.31.0"
	}

	window.Config = function(key){
		return key.indexOf(".") !== -1?util.has(CONFIG,key) : CONFIG[key];
	}
})();