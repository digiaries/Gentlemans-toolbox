(function(){
	var APP;
	window.APP = APP = new Core();
	var caches ={};
	function Preview(){
		this._ = {
			uri: '',
			name: 'APP',
			parent: 0,
			guid: 1
		};
		caches['1'] = this;
		caches.length++;
		this.init();
	}
	Extend(
		Preview
		,Module
		,{
			init:function(){
				this.$selected = {};
				this.doms = {
					"loading":null
					,"contain":null
					,"sections":{}
					,"articles":{}
					,"pop":null
					,"popArea":null
					,"popMask":null
					,"expAllBox":null
					,"expAll":null
					,"noData":null
				}

				this.$status = {
					// 弹出层状态
					"pop":false
					,"tip":false
				}

				this.$len = 0;

				// ctrl状态
				this.$ctrlPress = false;

				setTimeout(function(){
					// 1s的准备时间
					this.getRecord();
				}.bind(this),1000);
			}
			/**
			 * 事件绑定函数
			 * @return {Undefined} 无返回值
			 */
			,bindEvent:function(){

				// 图片点击事件
				this.doms.contain.find(".typeArticle li")
					.bind("click",function(ev){
						var tag = $(ev.target).closest("li");
						if(this.$ctrlPress){
							// 按住ctrl并点击图片
							window.open(tag.find("img").attr("src"));
						}else{
							// 单纯的点击
							tag.toggleClass("act")
								.find(":checkbox")
								.prop("checked",function(i,val){
									return !val;
								});
						}
					}.bind(this));

				// 按键监听
				// 当前只处理ctrl
				$(document).bind("keydown keyup",function(ev){
					if(ev.keyCode === 17 && ev.type === "keydown"){
						// 按住
						this.$ctrlPress = true;
					}else{
						// 松开
						this.$ctrlPress = false;
					}
				}.bind(this));

				// 导出按钮
				this.doms.contain.find(".exportUrls").bind("click",function(ev){
					var tag = $(ev.target)
						,type = tag.attr("data-type")
						,key = tag.attr("data-key")
						,select = this.doms.articles[key].find(":checked")
						,re = {
							"title":null
							,"type":null
							,"urls":[]
							,"key":key
						}
						,data = this.$data[type][key]
						,i;

					// 循环选择的项目
					select.each(function(){
						i = this.value;
						if(data[i]){
							if(!re.title){
								re.title = data[i].title;
							}
							if(!re.type){
								re.type = data[i].type;
							}
							re.urls.push(data[i].url);
						}
					});

					if(re.urls.length){
						// 有选中
						this.showExports(re);
					}
					tag = type = key = select = re = data = i = null;
				}.bind(this));

				// 全选
				this.doms.contain.find(".selectAll").bind("change",function(ev){
					var tag = $(ev.target)
						,status = tag.prop("checked")
						,key = tag.attr("data-key");

					// 处理checkbox
					this.doms.articles[key]
						.find(":checkbox").prop("checked",status);

					// 处理选中样式
					this.doms.articles[key].find("li")[
						status && "addClass" || "removeClass"
					]("act");
				}.bind(this));

				// 弹出层关闭按钮
				this.doms.popClose.bind("click",this.hideExports.bind(this));

				// 弹出层保存按钮
				this.doms.popSave.bind("click",function(){
					this.save();
				}.bind(this));

				// 隐藏提示
				this.doms.tip.bind("click",this.hideTip.bind(this));

				// 顶部功能按钮
				this.doms.expBtns.bind("click",this.expHandler.bind(this));
			}
			/**
			 * 顶部批量功能处理函数
			 * @param  {Object}    ev 事件对象
			 * @return {Undefined}    无返回值
			 */
			,expHandler:function(ev){
				var type = $(ev.target).attr("data-type");
				switch(type){
					case "saveAll":
						this.saveAllRecordedImgs();
					break;

					case "rechkAll":
						this.chkPostedAndClean();
					break;
				}
			}
			,saveAllRecordedImgs:function(){
				var data = _formatRecordData(this.$data,"rechkAllPostedImgs");
				// 发送
				this.save(
					data
					,function(re){
						APP.notice({
							"title":"服务器君正在努力工作"
							,"msg":re.msg
						});
						if(re.ok){
							re = re.result.items;
							var beRemove,item;
							for(var i = 0,len = re.length;i<len;i++){
								item = re[i];
								beRemove = this.$data[item.sources][item.key];
								this.doms.articles[item.key].remove();
								delete this.doms.articles[item.key];
								delete this.$data[item.sources][item.key];
								APP.moveToPostDbByKey(beRemove,item.key);
							}
							this.doms.contain.hide();
							this.doms.expAllBox.hide();
							this.doms.noData.show();
							beRemove = item = re = data = null;
						}
					}.bind(this)
					,"damnMuch"
				);
			}
			/**
			 * 检测已保存的图片
			 * @return {Undefined} 无返回值
			 */
			,chkPostedAndClean:function(){
				if(confirm("该功能将检测过往保存过的所有图片并将其记录从数据库中删除。\n\n确定要这么做吗？")){
					// 从数据库中取出所有之前保存过的图片
					this.getRecord(
						function(re){
							// 转格式
							var data = _formatRecordData(this.formatData(re),"rechkAllPostedImgs");

							// 发送
							this.save(
								data
								,function(re){
									APP.notice({
										"title":"服务器君正在努力工作"
										,"msg":re.msg
									});
									APP.delPosted(function(re){
										console.log("删除了"+re+"条项目");
									});
									data = null;
								}
								,"rechkPosted"
							);
							data = null;
						}.bind(this)
						,"posted"
					);
				}
			}
			/**
			 * 保存到服务器
			 * @return {Undefined} 无返回值
			 */
			,save:function(data,callback,type){
				var area = this.doms.popArea;
				type = type || "save";

				data = data || {
					"type":"saveImgFiles"
					,"sources":area.popType.val()
					,"title":area.title.val()
					,"key":area.key.val()
					,"items":JSON.stringify(area.urls.val().split("\n"))
				}

				callback = util.isFunc(callback) && callback || function(re){
					APP.notice({
						"title":"可喜可贺"
						,"msg":re.msg
					});
					if(re.ok){
						re = re.result.items;
						this.removeItems(re);
						this.hideExports();
						if(util.isEmpty(this.doms.articles)){
							this.doms.contain.hide();
							this.doms.expAllBox.hide();
							this.doms.noData.show();
						}
						re = data = null;
					}
				}.bind(this);

				$.post(
					"http://api.chaoticsea.tk:81?type="+type
					,data
					,callback
				);
				area = null;
			}
			/**
			 * 删除选中的项目
			 * @param  {Object}    re 服务端返回的数据
			 * @return {Undefined}    无返回值
			 */
			,removeItems:function(re){
				var data = this.$data[re.sources][re.key]
					,article = this.doms.articles[re.key]
					,chked = article.find("li :checked")
					,beRemove = [];

				if(chked.length === data.length){
					article.remove();
					beRemove = data;
					delete this.doms.articles[re.key];
					delete this.$data[re.sources][re.key];
				}else{
					chked.each(function(){
						var tag = $(this).closest("li")
							,index = tag.find(":button").val()-1
							,url = tag.find("img:first").attr("src");
						if(data[index].url === url){
							beRemove.push(data[index]);
							tag.remove();
						}
					});
				}
				APP.moveToPostDbByKey(beRemove,re.key);
			}
			/**
			 * 显示导出弹出层
			 * @param  {Object}    data 要显示的数据
			 * @return {Undefined}      无返回值
			 */
			,showExports:function(data){
				var pop = this.doms.popArea
					,tmp;
				if(!this.$status.pop){
					// 弹出层还未创建
					pop.append(
						_buildReList()
					);
					tmp = pop.find('input');
					pop.popType = tmp.eq(0);
					pop.title = tmp.eq(1);
					pop.key = tmp.eq(2);
					pop.urls = pop.find("textarea");
					this.$status.pop = true;
				}
				pop.popType.val(data.type);
				pop.title.val(data.title);
				pop.key.val(data.key);
				// 开启浏览器下载功能
				// @todo 大量下载会导致浏览器崩溃。只能npapi或自己复制列表用工具下载
				/*for(var i = 0,len = data.urls.length;i<len;i++){
					 chrome.downloads.download(
						{
							"url":data.urls[i]
						}
						,function(id) {
						}
					);
				}*/

				// 文件地址列表
				pop.urls.val(data.urls.join("\n"));

				this.doms.popMask
					.height($(document).height())
					.show();
				this.doms.pop.addClass("showPop");
			}
			/**
			 * 隐藏提示弹出层
			 * @return {Undefined} 无返回值
			 */
			,hideTip:function(){
				this.doms.tip.removeClass("tipShow");
				this.$status.tip = false;
			}
			/**
			 * 隐藏导出弹出层
			 * @return {Undefined} 无返回值
			 */
			,hideExports:function(){
				var pop = this.doms.popArea;
				this.doms.popMask.hide();
				this.doms.pop.removeClass("showPop");
				pop.popType.val("");
				pop.title.val("");
				pop.urls.val("");
				pop = null;
			}
			/**
			 * 设定要显示的数据
			 * @param  {Object}    data 数据
			 * @return {Undefined}      无返回值
			 */
			,setData:function(data){
				this.$len = data.length;
				this.$data = this.formatData(data);
				this.build(this.$data);
			}
			/**
			 * 构建界面
			 * @param  {Object}    data 数据对象
			 * @return {Undefined}      无返回值
			 */
			,build:function(data){
				var doms = this.doms;
				if(!doms.contain){
					// 缓存必要的DOM对象
					doms.contain = $("#showArea");
					doms.loading = $(".isLoading");
					doms.pop = $("#exportPop");
					doms.popMask = $("#exportPopMask");
					doms.popArea = doms.pop.find("div:first");
					doms.popClose = doms.pop.find("input[data-type='close']");
					doms.popSave = doms.pop.find("input[data-type='save']");
					doms.tip = $("#previewTip");
					doms.expAllBox = $("#expAllBox");
					doms.expBtns = doms.expAllBox.find("input");
					doms.noData = $("#noDataBox");
				}

				doms.loading.addClass("hideLoading");

				if(this.$len){
					var section;
					for(var n in data){
						// 生成每个站点
						section = $('<section class="typeSection"></section>');
						for(var m in data[n]){
							// 生成每一篇
							doms.articles[m] = $(_buildBlock(data[n][m]));
							section.append(doms.articles[m]);
						}
						doms.sections[n] = section;
						doms.contain.append(section);
					}

					// 显示提示
					doms.tip.addClass("tipShow");
					this.$status.tip = true;
					// 3s后隐藏
					setTimeout(function(){
						if(this.$status.tip){
							this.hideTip();
						}
					}.bind(this),3000);
					doms.expAllBox.show();
				}else{
					doms.noData.show();
				}

				// 事件绑定
				this.bindEvent();
			}
			/**
			 * 从数据库中获取记录
			 * @param  {Function}    cb   回调函数
			 * @param  {String}      type 数据库类型
			 * @return {Undefined}        无返回值
			 */
			,getRecord:function(cb,type){
				cb = cb || this.setData;
				APP.getRecordedImg(cb.bind(this),type);
			}
			,formatData:function(data){
				var dat = {}
				// 生成模块可用的数据
				data.forEach(function(item){
					dat[item.type] = dat[item.type] || {};
					dat[item.type][item.key] = dat[item.type][item.key] || [];
					dat[item.type][item.key].push(item);
				});

				return dat;
			}
		}
	);

	/**
	 * 生成站点文章
	 * @param  {Array}   data 文章数组
	 * @return {String}       html字符串
	 * @private
	 */
	function _buildBlock(data){
		var dat = data[0];
		var htm = ['<article class="typeArticle"><h2>'+dat.title+'</h2><div class="subTitle">'];
		htm.push('<p><span>'+dat.typeName+'</span><em>'+dat.time+'</em></p>');
		htm.push('<div><input data-type="'+dat.type+'" data-key="'+dat.key+'" class="selectAll" type="checkbox" id="selectAll_'+dat.timestamp+'" /><label for="selectAll_'+dat.timestamp+'">全选</label><input type="button" class="btn exportUrls" data-type="'+dat.type+'" data-key="'+dat.key+'" class="btn" value="导出" /></div>');
		htm.push('</div><div class="reList"><ul>');
		data.forEach(function(item,index){
			htm.push('<li><input type="button" value="'+(index+1)+'" /><div><img src="'+item.url+'" /></div><input type="checkbox" value="'+index+'" data-type="'+item.type+'" data-key="'+item.key+'" /></li>');
		});
		htm.push('</ul></div></article>');
		htm = htm.join("");
		dat = null;
		return htm;
	}

	/**
	 * 构造文章内容列表(图片)
	 * @return {String} 列表字符串
	 * @private
	 */
	function _buildReList(){
		var htm = ['<ul>'];
		htm.push('<li><input data-type="type" type="text" readonly="true" /></li>');
		htm.push('<li><input data-type="title" type="text" readonly="true" /><input data-type="key" type="hidden" readonly="true" /></li>');
		htm.push('<li><textarea data-type="urls"></textarea></li>');
		htm.push('</ul>');
		return htm.join("");
	}

	function _formatRecordData(dat,type){
		var data = []
			,tmp;
		for(var n in dat){
			for(var m in dat[n]){
				tmp = {
					"title":dat[n][m][0].title
					,"sources":dat[n][m][0].type
					,"items":[]
					,"key":dat[n][m][0].key
				}
				dat[n][m].forEach(function(it){
					tmp.items.push(it.url);
				});
				tmp.items = tmp.items;
				data.push(tmp);
			}
		}
		data = {
			"type":type
			,"items":data
		}
		data.items = JSON.stringify(data.items);
		tmp = dat = null;
		return data;
	}

	window.PV = new Preview();
})()