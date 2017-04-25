var dm = fl.getDocumentDOM();
if(!dm)
{
	alert("请先打开一个fla文档");
}
else
{
	dm = fl.getDocumentDOM();
	var lib = dm.library;
	
	var items = lib.items;
	var len = items.length;
	for(var i=0;i<len;i++)
	{
		updateItem(items[i]);
	}
	fl.saveDocument(dm);
}


function updateItem(item)
{
	if(item.itemType =="bitmap")
	{
		if(dm.library.updateItem(item.name))
		{
			fl.trace("成功更新:"+item.name);
		}
		
	}
}