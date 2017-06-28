function run() {
    var folderuri = fl.browseForFolderURL("选择一个文件夹");

    var folderContents = FLfile.listFolder(folderuri + "/" + "*.png", "files");
    if (!(folderContents && folderContents.length)) {
        alert("所选文件夹没有任何PNG图像");
    } else {

        var dm = fl.getDocumentDOM();
        var isNew;
        if (!dm) {
            dm = fl.createDocument();
            isNew = true;
        }

        if (!dm) {
            alert("当前没有文档并且新建文档失败！");
            return;
        }

        var lib = dm.library;

        if (!dm.documentHasData("folderurl")) {
            dm.addDataToDocument("folderurl", "string", folderuri);
        }
        if (dm.documentHasData("folderurl")) {
            fl.trace("documentHasData:" + dm.getDataFromDocument("folderurl"));
        }


        var tempArr = folderuri.split("|")[1].split("/");
        var folderName = tempArr[tempArr.length - 1];

        if (!/[a-z][a-z0-9_]+/.test(folderName)) {
            alert("文件夹名称只允许使用小写字母( a-z )，数字( 0-9 )和下划线( _ )，并且以字母开头！");
            return;
        }

        fl.trace("文件夹名:" + folderName);


        if (!lib.itemExists(folderName)) {
            lib.addNewItem("movie clip", folderName);
        }

        if (!lib.itemExists(folderName + "_source")) {
            lib.addNewItem("folder", folderName + "_source");
        }

        lib.editItem(folderName);

        var len = folderContents.length;
        var tempurl;
        var ExportKEY = {
            ArtText: "arttext",
            ArtWord: "artword"
        }
        var key = ExportKEY.ArtText; //默认arttext流程
        var has2char;
        for (var i = 0; i < len; i++) {
            tempurl = folderContents[i];
            fl.trace(i + ":" + tempurl + "\t" + folderuri + "/" + tempurl);
            dm.importFile(folderuri + "/" + tempurl);
            var fileName = tempurl.split(".")[0];
            if (fileName.length > 1) {
                has2char = true;
            }
            lib.moveToFolder(folderName + "_source", folderContents[i]);
        }
        //是否平铺位图，不平铺位图则直接让其叠在一起
        var tileImage;
        if (has2char) {
            if (confirm("检查到图片有超过2个字的文件名，将使用字库(sui.ArtWord)方式导入，确认么？")) {
                key = ExportKEY.ArtWord;
            } else {
                return;
            }
        } else {
            if (confirm("确认用sui.ArtText原件进行导入么？\n取消使用字库(sui.ArtWord)方式导入")) {
                key = ExportKEY.ArtText;
            } else {
                key = ExportKEY.ArtWord;
            }
        }
        if (key == ExportKEY.ArtWord) {
            tileImage = true;
        }

        lib.selectItem(folderName);

        var item = lib.getSelectedItems()[0];


        var layers = item.timeline.layers;
        var frame = layers[0].frames[0];
        var elements = frame.elements;

        var element;
        var ox = 0;
        for (var j = 0; j < elements.length; j++) {
            element = elements[j];
            element.x = ox;
            if (tileImage) {
                ox += element.width;
            }
            fl.trace(j);
        }

        item.linkageExportForAS = true;
        item.linkageClassName = "bmd." + key + "." + cameClassName(folderName);

        dm.exitEditMode();
        //fl.saveDocument(dm, isNew ? folderuri + "/" + folderName + ".fla" : undefined);

    }
}

function cameClassName(name) {
    var arr = name.split("_");
    var out = "";
    for (var i = 0, len = arr.length; i < len; i++) {
        var n = arr[i];
        n = n[0].toUpperCase() + n.substr(1);
        out += n;
    }
    return out;
}

run();