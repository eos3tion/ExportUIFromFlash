var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * 单字字库，数据必须为单个文字
 * ShapeNumberParser extends ComWillCheck
 */
var ArtTextParser = (function (_super) {
    __extends(ArtTextParser, _super);
    function ArtTextParser() {
        var _this = _super.call(this, 6 /* ArtText */, /^bmd[.](arttext)/, null, "sui.ArtText") || this;
        _this.parseHandler = _this.shapeNumberParser;
        return _this;
    }
    ArtTextParser.prototype.shapeNumberParser = function (checker, item, list, solution) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        var data = [];
        list[item.$idx] = data;
        if (llen > 1) {
            Log.throwError("ArtText必须且只能有1个图层", item.name);
            return;
        }
        var layer = layers[0];
        var lname = layer.name;
        var tempkey = "";
        var flen = layer.frames.length;
        var frame = layer.frames[0];
        data[1] = 0;
        var elements = frame.elements;
        var elen = elements.length;
        for (var ei = 0; ei < elen; ei++) {
            var ele = elements[ei];
            var tempName = void 0;
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
    };
    return ArtTextParser;
}(ComWillCheck));
