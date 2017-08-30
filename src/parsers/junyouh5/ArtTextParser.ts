/**
 * 单字字库，数据必须为单个文字
 * ShapeNumberParser extends ComWillCheck
 */
class ArtTextParser extends ComWillCheck {
    constructor() {
        super(ExportType.ArtText, /^bmd[.](arttext)[.]/, null, "ArtText");
    }

    doParser(item: FlashItem, solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;

        if (llen > 1) {
            Log.throwError("ArtText必须且只能有1个图层", item.name);
            return;
        }
        let data = [];
        let layer = layers[0];
        let lname = layer.name;

        let tempkey = "";
        let flen = layer.frames.length;

        let frame = layer.frames[0];
        data[1] = 0;

        let elements = frame.elements;
        let elen = elements.length;
        for (let ei = 0; ei < elen; ei++) {
            let ele = elements[ei];
            let tempName: string;
            if (ele && ele.elementType === "instance" && ele.instanceType === "bitmap") {
                // 由于只需要位图的索引
                data[ei + 1] = solution.getBitmapIndex(ele.libraryItem);
                tempName = ele.libraryItem.name;
                tempName = tempName.substr(tempName.lastIndexOf("/") + 1);
                tempName = tempName.split(".")[0];
                if (tempName.length > 1) {
                    Log.throwError("ArtText所引用的png的名字只能为单个字符", item.name, tempName);
                }
                else {
                    tempkey += tempName;
                }
            }
        }
        data[0] = tempkey;
        return data;
    }
}