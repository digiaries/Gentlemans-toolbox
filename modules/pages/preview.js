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
					"pop":false
				}
				setTimeout(function(){
					this.getRecord();
				}.bind(this),1000);
			}
			,bindEvent:function(){
				this.doms.contain.find(".typeArticle li").bind("click",function(ev){
					var tag = $(ev.target).closest("li");
					tag.toggleClass("act")
						.find(":checkbox")
						.prop("checked",function(i,val){
							return !val;
						});
				}.bind(this));

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
						this.showExports(re);
					}
					tag = type = key = select = re = data = i = null;
				}.bind(this));

				this.doms.contain.find(".selectAll").bind("change",function(ev){
					var tag = $(ev.target)
						,status = tag.prop("checked")
						,key = tag.attr("data-key");
					this.doms.articles[key]
						.find(":checkbox").prop("checked",status);
					this.doms.articles[key].find("li")[
						status && "addClass" || "removeClass"
					]("act");
				}.bind(this));

				this.doms.popClose.bind("click",this.hideExports.bind(this));

			}
			,showExports:function(data){
				var pop = this.doms.popArea
					,tmp;
				if(!this.$status.pop){
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
				pop.urls.val(data.urls.join("\n"));
				this.doms.popMask
					.height($(document).height())
					.show();
				this.doms.pop.addClass("showPop");
			}
			,hideExports:function(){
				var pop = this.doms.popArea;
				this.doms.popMask.hide();
				this.doms.pop.removeClass("showPop");
				pop.popType.val("");
				pop.title.val("");
				pop.urls.val("");
				pop = null;
			}
			,setData:function(data){
				var dat = {}
				data.forEach(function(item){
					dat[item.type] = dat[item.type] || {};
					dat[item.type][item.key] = dat[item.type][item.key] || [];
					dat[item.type][item.key].push(item);
				});
				this.$data = dat;
				this.build(this.$data);
			}
			,build:function(data){
				if(!this.doms.contain){
					this.doms.contain = $("#showArea");
					this.doms.loading = $(".isLoading");
					this.doms.pop = $("#exportPop");
					this.doms.popMask = $("#exportPopMask");
					this.doms.popArea = this.doms.pop.find("div:first");
					this.doms.popClose = this.doms.pop.find("input");
				}
				var section;
				this.doms.loading.addClass("hideLoading");
				for(var n in data){
					section = $('<section class="typeSection"></section>');
					for(var m in data[n]){
						this.doms.articles[m] = $(_buildBlock(data[n][m]));
						section.append(this.doms.articles[m]);
					}
					this.doms.sections[n] = section;
					this.doms.contain.append(section);
				}
				this.bindEvent();
			}
			,getRecord:function(cb){
				cb = cb || this.setData;
				APP.getRecordedImg(cb.bind(this));
			}
		}
	);

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