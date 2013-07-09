(function(){

	var CONFIG = {
		// 数据库配置
		"db":{
			"dbname":"Pu"
			,"version":1
			,"structure":{
				// 插件收集的图片
				"incomming_img":{
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
						,"time":{
							"keyPath":"time"
							,"config":{
								"unique":false
							}
						}
						,"key":{
							"keyPath":"key"
							,"config":{
								"unique":false
							}
						}
					}
				}
				// 已发送的图片
				,"posted_img":{
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
						,"time":{
							"keyPath":"time"
							,"config":{
								"unique":false
							}
						}
						,"key":{
							"keyPath":"key"
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
			"imgs":{
				"exDb":"incomming_img"
				,"posted":"posted_img"
			}
		}
		// 插件版本
		,"version":"2013.3.31.0"
	}

	window.Config = function(key){
		return key.indexOf(".") !== -1?util.has(CONFIG,key) : CONFIG[key];
	}
})();