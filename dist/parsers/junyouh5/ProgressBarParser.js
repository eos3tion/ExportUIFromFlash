var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * 进度条解析器
 *
 * @class ProgressBarParser
 * @extends {ComWillCheck}
 * @author pb
 */
var ProgressBarParser = (function (_super) {
    __extends(ProgressBarParser, _super);
    function ProgressBarParser() {
        var _this = _super.call(this, 10 /* ProgressBar */, /^ui[.](progress)/, null, "sui.ProgressBar") || this;
        _this.parseHandler = _this.progressBarParser;
        return _this;
    }
    /**
     * 用于处理进度条
     * 支持3图层 txt bar bg
     * 支持2图层 txt bar
     */
    ProgressBarParser.prototype.progressBarParser = function (checker, item, list, solution) {
        // 检查进度条的帧
        var timeline = item.timeline;
        // 多图层
        var layers = timeline.layers;
        var len = layers.length;
        var data = [];
        list[item.$idx] = data;
        var layer;
        var name;
        var frame;
        var elements;
        var barWidth;
        var bData;
        // 遍历图层
        for (var i = 0; i < len; i++) {
            layer = layers[i];
            name = layer.name;
            if (name) {
                frame = layer.frames[0];
                elements = frame.elements;
                var e = elements[0];
                //文本
                if (name === "tf") {
                    data[0] = solution.getElementData(e);
                }
                else if (name === "bar") {
                    bData = solution.getElementData(e);
                    data[1] = bData;
                    if (bData)
                        barWidth = bData[1][3];
                    else
                        Log.throwError("进度条宽度未设置，请确认.", item.name);
                }
                else if (name === "bg") {
                    bData = solution.getElementData(e);
                    data[2] = bData;
                    if (bData) {
                        var bgWidth = bData[1][3];
                        if (barWidth && bgWidth && barWidth > bgWidth)
                            Log.throwError("进度条宽度大于底图宽度，请确认", item.name);
                    }
                }
            }
        }
    };
    return ProgressBarParser;
}(ComWillCheck));
