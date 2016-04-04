var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ButtonParser = (function (_super) {
    __extends(ButtonParser, _super);
    function ButtonParser() {
        _super.call(this, ExportType.Button, /^ui[.](btn|tab|checkbox|radiobox)/, null, "Button");
        this.parseHandler = this.buttonParser;
    }
    /**
     * 用于处理按钮
     */
    ButtonParser.prototype.buttonParser = function (checker, item, list, solution) {
        // 检查按钮的帧
        var timeline = item.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        var data = [];
        list[item.$idx] = data;
        // 使用导出名作为key
        // 按钮必须1层或者2层
        // 层名字为label 放文本框或者留空
        // 层名字为bg 放3帧或者4帧图片
        for (var li = 0; li < llen; li++) {
            var layer = layers[li];
            var lname = layer.name;
            // 默认无文本框
            data[0] = 0;
            if (lname === "tf") {
                var frame = layer.frames[0];
                var elements = frame.elements;
                var tf = elements[0];
                if (tf && tf.elementType === "text") {
                    data[0] = solution.getElementData(tf);
                }
            }
            else if (lname === "bg") {
                var flen = Math.min(4, layer.frames.length); // 最多4帧
                for (var fi = 0; fi < flen; fi++) {
                    var frame = layer.frames[fi];
                    data[fi + 1] = 0;
                    if (frame.startFrame !== fi) {
                        continue;
                    }
                    var elements = frame.elements;
                    var elen = elements.length;
                    for (var ei = 0; ei < elen; ei++) {
                        var ele = elements[ei];
                        if (ele && ele.elementType === "instance" && ele.instanceType === "bitmap") {
                            data[fi + 1] = solution.getElementData(ele);
                        }
                    }
                }
            }
            else {
                Log.throwError("不支持这种按钮：", item.name);
            }
        }
    };
    return ButtonParser;
}(ComWillCheck));
