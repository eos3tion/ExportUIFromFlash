var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SlotBgParser = (function (_super) {
    __extends(SlotBgParser, _super);
    function SlotBgParser() {
        _super.call(this, ExportType.SlotBg, /^bmd[.](slotbg)/, null, "egret.DisplayObjectContainer");
        this.parseHandler = this.slotBgParser;
    }
    SlotBgParser.prototype.slotBgParser = function (checker, item, list, solution) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        var data = [];
        list[item.$idx] = data;
        var grid = item.scalingGrid;
        if (!grid) {
            Log.throwError("此控件没有设置九宫信息", item.name);
            return;
        }
        if (layers.length > 2) {
            Log.throwError("slotbg只能有一个图层", item.name);
            return;
        }
        var layer = null;
        layer = layers[0];
        if (layer.frames.length > 1) {
            Log.throwError("slotbg只能为1帧", item.name);
            return;
        }
        var elements = layer.frames[0].elements;
        if (elements.length > 1) {
            Log.throwError("slotbg引导层只能引用一张位图", item.name);
            return;
        }
        var ele = elements[0];
        data[0] = 0;
        if (ele && ele.elementType === "instance" && ele.instanceType === "bitmap") {
            data[0] = solution.getElementData(ele);
        }
        var gridRect = item.scalingGridRect;
        var gx = Math.round(gridRect.left);
        var gy = Math.round(gridRect.top);
        var gr = Math.round(gridRect.right);
        var gb = Math.round(gridRect.bottom);
        data[1] = [gx, gy, gr - gx, gb - gy];
    };
    return SlotBgParser;
}(ComWillCheck));
