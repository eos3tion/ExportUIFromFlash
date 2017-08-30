/**
 * 进度条解析器
 * 
 * @class ProgressBarParser
 * @extends {ComWillCheck}
 * @author pb
 */
class ProgressBarParser extends ComWillCheck {
    constructor() {
        super(ExportType.ProgressBar, /^ui[.](progress)[.]/, null, "ProgressBar");
    }
    /**
     * 用于处理进度条
     * 支持3图层 txt bar bg
     * 支持2图层 txt bar
     */
    doParser(item: FlashItem, solution: Solution) {
        // 检查进度条的帧
        let timeline = item.timeline;
        // 多图层
        let layers = timeline.layers;
        let len = layers.length;
        let data = [];

        let layer;
        let name;
        let frame;
        let elements;
        let barWidth;
        let bData;
        // 遍历图层
        for (let i = 0; i < len; i++) {
            layer = layers[i];
            name = layer.name;
            if (name) {
                frame = layer.frames[0];
                elements = frame.elements;
                let e = elements[0];
                //文本
                if (name === "tf") {
                    data[0] = solution.getElementData(e);
                }
                // 进度条
                else if (name === "bar") {
                    bData = solution.getElementData(e);
                    data[1] = bData;
                    if (bData)
                        barWidth = bData[1][3];
                    else
                        Log.throwError("进度条宽度未设置，请确认.", item.name);
                }
                // 底图 无底图时不处理
                else if (name === "bg") {
                    bData = solution.getElementData(e);
                    data[2] = bData;
                    if (bData) {
                        let bgWidth = bData[1][3];
                        if (barWidth && bgWidth && barWidth > bgWidth)
                            Log.throwError("进度条宽度大于底图宽度，请确认", item.name);
                    }
                }
            }
        }
        return data;
    }
}