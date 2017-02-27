try{
	var dom = fl.getDocumentDOM();
	if(dom){
		var xml=XML(dom.exportPublishProfileString());
		var lib = dom.library;
		var items = lib.items;
		var len = items.length;
		var quality = xml.PublishJpegProperties.Quality;
		if(len){
			var tempName = "$$$temp";
			if (lib.itemExists(tempName)) {
				lib.deleteItem(tempName);
			}
			lib.addNewItem("movie clip",tempName);
			lib.selectItem(tempName);
			lib.editItem(tempName);
			fl.trace(items.length);
			for(var i=0;i<len;i++){
				var item = items[i];
				fl.trace(i);
				if(item.itemType == "bitmap"){
					while(!lib.addItemToDocument({x:0,y:0},item.name));
					dom.selectAll();
					var bmp = dom.selection[0];
					if(!bmp){
						continue;
					}
					var bits = bmp.getBits().bits;
					var transparent = false;
					for(var j=1;j<bits.length;j+=2){
						if((bits.charCodeAt(j)&0xff00)!=0xff00){
							transparent = true;
							break;
						}
					}
					if(transparent){
						item.compressionType = "lossless";//png
					}else{
						item.compressionType = "photo";//jpg
						item.quality = quality;
					}
					dom.deleteSelection();
				}
			}
			dom.exitEditMode();
			lib.deleteItem(tempName);
			dom.save();
		}
	}
}catch(e){
	//输出未捕获的异常
    fl.trace(e.stack);
}
alert("完成")