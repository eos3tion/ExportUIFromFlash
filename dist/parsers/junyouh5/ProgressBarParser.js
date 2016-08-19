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
        _super.call(this, ExportType.ProgressBar, /^ui[.](progress)/, null, "sui.ProgressBar");
        this.parseHandler = this.progressBarParser;
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
        // 遍历图层
        for (var i = 0; i < len; i++) {
            layer = layers[i];
            frame = layer.frames[0];
            elements = frame.elements;
            var e = elements[0];
            if (e) {
                //文本
                if (e.elementType === "text") {
                    data[0] = solution.getElementData(e);
                } // 进度条
                else if (e.elementType === "instance" && e.instanceType === "symbol") {
                    var barData = solution.getElementData(e);
                    data[1] = barData;
                    if (barData)
                        barWidth = barData[1][3];
                    else
                        Log.throwError("进度条宽度未设置，请确认.", item.name);
                } // 底图 无底图时不处理
                else if (e.elementType === "instance" && e.instanceType === "bitmap") {
                    var bgData = solution.getElementData(e);
                    data[2] = bgData;
                    if (bgData) {
                        var bgWidth = bgData[1][3];
                        if (barWidth && bgWidth && barWidth > bgWidth)
                            Log.throwError("进度条宽度大于底图宽度，请确认", item.name);
                    }
                }
            }
        }
    };
    return ProgressBarParser;
}(ComWillCheck));
