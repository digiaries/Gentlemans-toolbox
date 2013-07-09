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
				}

				this.$status = {
					// 弹出层状态
					"pop":false
					,"tip":false
				}

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
				this.doms.popSave.bind("click",this.save.bind(this));

				// 隐藏提示
				this.doms.tip.bind("click",this.hideTip.bind(this));
			}
			/**
			 * 保存到服务器
			 * @return {Undefined} 无返回值
			 */
			,save:function(){
				var area = this.doms.popArea;
				$.post(
					"http://api.chaoticsea.tk:81"
					,{
						"type":"saveImgFiles"
						,"sources":area.popType.val()
						,"title":area.title.val()
						,"items":area.urls.val().split("\n").toString()
					}
					,function(re){
						APP.notice({
							"title":"可喜可贺"
							,"msg":re.msg
						});
						// @todo 标识已下载的文件。下次预览就不显示了
						// @todo 改数据库结构
					}
				);
				area = null;
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
					pop.urls = pop.find("textarea");
				}
				pop.popType.val(data.type);
				pop.title.val(data.title);

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
				var dat = {}
				// 生成模块可用的数据
				data.forEach(function(item){
					dat[item.type] = dat[item.type] || {};
					dat[item.type][item.key] = dat[item.type][item.key] || [];
					dat[item.type][item.key].push(item);
				});
				this.$data = dat;
				this.build(this.$data);
				dat = null;
			}
			/**
			 * 构建界面
			 * @param  {Object}    data 数据对象
			 * @return {Undefined}      无返回值
			 */
			,build:function(data){
				if(!this.doms.contain){
					// 缓存必要的DOM对象
					this.doms.contain = $("#showArea");
					this.doms.loading = $(".isLoading");
					this.doms.pop = $("#exportPop");
					this.doms.popMask = $("#exportPopMask");
					this.doms.popArea = this.doms.pop.find("div:first");
					this.doms.popClose = this.doms.pop.find("input[data-type='close']");
					this.doms.popSave = this.doms.pop.find("input[data-type='save']");
					this.doms.tip = $("#previewTip");
				}
				var section;
				this.doms.loading.addClass("hideLoading");
				for(var n in data){
					// 生成每个站点
					section = $('<section class="typeSection"></section>');
					for(var m in data[n]){
						// 生成每一篇
						this.doms.articles[m] = $(_buildBlock(data[n][m]));
						section.append(this.doms.articles[m]);
					}
					this.doms.sections[n] = section;
					this.doms.contain.append(section);
				}
				// 事件绑定
				this.bindEvent();

				// 显示提示
				this.doms.tip.addClass("tipShow");
				this.$status.tip = true;
				// 3s后隐藏
				setTimeout(function(){
					if(this.$status.tip){
						this.hideTip();
					}
				}.bind(this),3000);
			}
			/**
			 * 从数据库中获取记录
			 * @param  {Function}    cb 回调函数
			 * @return {Undefined}      无返回值
			 */
			,getRecord:function(cb){
				cb = cb || this.setData;
				APP.getRecordedImg(cb.bind(this));
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
		htm.push('<p><span>'+dat.type.toUpperCase()+'</span><em>'+dat.time+'</em></p>');
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
		htm.push('<li><input data-type="title" type="text" readonly="true" /></li>');
		htm.push('<li><textarea data-type="urls"></textarea></li>');
		htm.push('</ul>');
		return htm.join("");
	}

	window.PV = new Preview();
})()