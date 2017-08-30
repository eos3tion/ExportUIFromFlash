class SlotBgParser extends ComWillCheck {
    constructor() {
        super(ExportType.SlotBg, /^bmd[.](slotbg)[.]/, null, "egret.Bitmap");
    }

    doParser(item: FlashItem, solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;

        let grid = item.scalingGrid;
        if (!grid) {
            Log.throwError("此控件没有设置九宫信息", item.name);
            return;
        }
        if (layers.length > 2) {
            Log.throwError("slotbg只能有一个图层", item.name);
            return;
        }
        let layer = null;
        layer = layers[0];
        if (layer.frames.length > 1) {
            Log.throwError("slotbg只能为1帧", item.name);
            return;
        }
        let elements = layer.frames[0].elements;
        if (elements.length > 1) {
            Log.throwError("slotbg引导层只能引用一张位图", item.name);
            return;
        }
        let data = [];
        let ele = elements[0];
        data[0] = 0;
        if (ele && ele.elementType === "instance" && ele.instanceType === "bitmap") {
            data[0] = solution.getElementData(ele);
        }
        let gridRect = item.scalingGridRect;
        var gx = Math.round(gridRect.left);
        var gy = Math.round(gridRect.top);
        var gr = Math.round(gridRect.right);
        var gb = Math.round(gridRect.bottom);
        data[1] = [gx, gy, gr - gx, gb - gy];
        return data;
    }
}