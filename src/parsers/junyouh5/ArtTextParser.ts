/**
 * ShapeNumberParser extends ComWillCheck
 */
class ArtTextParser extends ComWillCheck {
    constructor() {
        super(ExportType.ArtText, /^bmd[.](arttext)/, null, "sui.ArtText");
        this.parseHandler = this.shapeNumberParser;
    }

    private shapeNumberParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];

        list[item.$idx] = data;

        if (llen > 1) {
            Log.throwError("ArtText必须且只能有1个图层", item.name);
            return;
        }

        let layer = layers[0];
        let lname = layer.name;

        let tempkey: string = "";
        let flen = layer.frames.length;

        let frame = layer.frames[0];
        data[1] = 0;

        let elements = frame.elements;
        let elen = elements.length;
        for (let ei = 0; ei < elen; ei++) {
            let ele = elements[ei];
            let tempName: string;
            if (ele && ele.elementType === "instance" && ele.instanceType === "bitmap") {
                data[ei + 1] = solution.getElementData(ele);
                tempName = ele.libraryItem.name;
                if (tempName.indexOf("/") != -1) {
                    let arr = tempName.split("/");
                    tempName = arr[arr.length - 1];
                }
                if (tempName.indexOf(".") != -1) {
                    tempName = tempName.split(".")[0];
                }
                if (tempName.length > 1) {
                    Log.throwError("ArtText所引用的png的名字只能为单个字符", item.name, tempName);
                }
                else {
                    tempkey += tempName;
                }

            }
        }

        data[0] = tempkey;

    }
}