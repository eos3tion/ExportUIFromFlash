var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ShareBitmapParser = (function (_super) {
    __extends(ShareBitmapParser, _super);
    function ShareBitmapParser() {
        _super.call(this, 12 /* ShareBmp */, /^bmd[.](share)/, null, "egret.Bitmap");
        this.parseHandler = this.shareParser;
    }
    ShareBitmapParser.prototype.shareParser = function (checker, item, list, solution) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        var data = [];
        list[item.$idx] = data;
        if (layers.length > 2) {
            Log.throwError("sharebmp只能有一个图层", item.name);
            return;
        }
        var layer = null;
        layer = layers[0];
        if (layer.frames.length > 1) {
            Log.throwError("sharebmp只能为1帧", item.name);
            return;
        }
        var elements = layer.frames[0].elements;
        if (elements.length > 1) {
            Log.throwError("sharebmp只能引用一张位图", item.name);
            return;
        }
        var ele = elements[0];
        if (ele.elementType === "instance" && ele.instanceType === "bitmap") {
            data[0] = solution.getElementData(ele);
        }
    };
    return ShareBitmapParser;
}(ComWillCheck));
