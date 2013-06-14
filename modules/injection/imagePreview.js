(function(){
	// @deprecated
	// @todo 只对图片进行操作。
	// @todo 过滤不必要的图片
	// @todo 增加索引操作

	var tagList = ["bbspink.com","g-pic.net/search/","http://www.benjee.org/cgi-bin/imgbbs_1.34/imgbbs.cgi"]
	var def = (function(href){
		var test = 0;
		for(var i =0;i<tagList.length;i++){
			if(href.indexOf(tagList[i]) !== -1){
				test = 1;
				break;
			}
		}
		return test;
	})(window.location.href)
	if(window.__CHROME_EXTENDSION_PREVIEW === undefined){
		__CHROME_EXTENDSION_PREVIEW = def;
	}else{
		return false;
	}
	var cache = {
		"previewWin":$('<div id="TheImageModulePreviewWin" data-action="close"><em>x</em><div></div><span style="display:none;">Loading...</span></div>')
		,"prevContant":null
		,"prevLoading":null
		,"prevClose":null
		,"el":null
		,"img":null
		,"body":$("body:first")
	};

	var regExp = {
		"url":/^(\w+):\/\/.*/
	}

	cache.prevContant = cache.previewWin.find("div");
	cache.prevLoading = cache.previewWin.find("span");
	cache.prevClose = cache.previewWin.find("em");

	$("body:first").append(cache.previewWin);

	function setPosition(dom,offset){
		offset = offset || dom.offset();

		offset.top = offset.top - 10;
		offset.left = offset.left + dom.outerWidth() - 10;

		if(offset.left + 440 > cache.body.width()){
			offset.left -= (offset.left + 440 - cache.body.width())
		}

		cache.previewWin.css(offset);

		dom = offset = null;
	}

	function getRealyHref(href,html){
		if(href !== html && regExp.url.exec(html)){
			href = html;
		}else{
			html = cache.el.find("img")
			if(html.length && !cache.el.closest("*[id*='nav']").length && html.attr("src").indexOf("logo") === -1){
				href = $(
					'<img />'
					,{
						"src":html.attr("src").replace("_t.","_o.")
						,"height":"400px"
						,"css":{
							"display":"none"
						}
						,load:function(){
							cache.prevLoading.hide();
							cache.img.show();
							setPosition(cache.el);
						}
					}
				);
				cache.prevLoading.show();
				cache.img = href;
			}else{
				href = null;
			}
		}
		return href;
	}

	function showPreview(){
		if(!__CHROME_EXTENDSION_PREVIEW){
			return true;
		}
		cache.prevLoading.hide();
		cache.el = $(this);
		var href = cache.el.attr("href");
		href = getRealyHref(cache.el.attr("href"),cache.el.html());
		if(href){
			setPosition(cache.el);
			cache.previewWin.show();
			cache.prevContant.html(typeof(href) === "string" && '<a href="'+href+'" target="_blank">'+href+'</a>' || href);
		}
	}

	function hidePreview(ev){
		if(!__CHROME_EXTENDSION_PREVIEW){
			return true;
		}
		if(!$(ev.target).closest("#TheImageModulePreviewWin").length || $(ev.target).attr("data-action") === "close"){
			if(cache.img){
				cache.img.unbind().remove();
				cache.img = null;
			}
			cache.previewWin.hide();
			cache.prevContant.text("");
		}
	}

	$("a[href]").bind("mouseenter",showPreview);

	$(document).bind("click",hidePreview);

	cache.prevClose.bind("click",hidePreview);

})()