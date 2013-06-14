(function(){

	$(function(){
		var t = $('<input type="button" value="走" style="font-size:100px;" />');
		$("body:first").append(t);
		t.bind("click",function(){
			var arr = [];
			$("img").each(function(){
				arr.push(this.src);
			});
			chrome.runtime.sendMessage(
				{
					"type":"test"
					,"data":{
						"say":arr
					}
				}
			);
		});

	});

})()