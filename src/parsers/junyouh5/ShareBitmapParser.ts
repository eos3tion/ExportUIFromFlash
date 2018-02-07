class ShareBitmapParser extends ComWillCheck {
    constructor() {
        super(ExportType.ShareBmp, /^bmd[.](share)[.]/, null, "egret.Bitmap");
    }
    public check(item: FlashItem, solution: Solution) {
        let reg = this.reg;
        reg.lastIndex = 0;
        let flag = reg.test(item.linkageClassName);
        if (flag) {
            if (item.scalingGrid) {
                return ExportType.ScaleBmp;
            } else {
                return this.key;
            }
        }
    }

    doParser(item: FlashItem, solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];
        if (layers.length > 2) {
            Log.throwError("sharebmp只能有一个图层", item.name);
            return;
        }
        let layer = null;
        layer = layers[0];
        if (layer.frames.length > 1) {
            Log.throwError("sharebmp只能为1帧", item.name);
            return;
        }
        let elements = layer.frames[0].elements;
        if (elements.length > 1) {
            Log.throwError("sharebmp只能引用一张位图", item.name);
            return;
        }
        let ele = elements[0];
        if (ele.elementType === "instance" && ele.instanceType === "bitmap") {
            data[0] = solution.getElementData(ele);
        }
        return data;
    }
}