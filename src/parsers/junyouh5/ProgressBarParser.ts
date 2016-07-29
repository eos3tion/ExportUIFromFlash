/**
 * 进度条解析器
 * 
 * @class ProgressBarParser
 * @extends {ComWillCheck}
 * @author pb
 */
class ProgressBarParser extends ComWillCheck {
    constructor() {
        super(ExportType.ProgressBar, /^ui[.](progress)/, null, "sui.ProgressBar");
        this.parseHandler = this.progressBarParser;
    }
    /**
     * 用于处理进度条
     * 支持3图层 txt bar bg
     * 支持2图层 txt bar
     */
    private progressBarParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        // 检查进度条的帧
        let timeline = item.timeline;
        // 多图层
        let layers = timeline.layers;
        let len = layers.length;
        let data = [];
        list[item.$idx] = data;

        let layer;
        let name;
        let frame;
        let elements;
        let barWidth;
        // 遍历图层
        for (let i = 0; i < len; i++) {
            layer = layers[i];
            frame = layer.frames[0];
            elements = frame.elements;
            let e = elements[0];
            if (e) {
                //文本
                if (e.elementType === "text") {
                    data[0] = solution.getElementData(e);
                } // 进度条
                else if (e.elementType === "instance" && e.instanceType === "symbol") {
                    let barData = solution.getElementData(e);
                    data[1] = barData;
                    if (barData)
                        barWidth = barData[1][3];
                    else
                        Log.throwError("进度条宽度未设置，请确认.", item.name);
                } // 底图 无底图时不处理
                else if (e.elementType === "instance" && e.instanceType === "bitmap") {
                    let bgData = solution.getElementData(e);
                    data[2] = bgData;
                    if (bgData) {
                        let bgWidth = bgData[1][3];
                        if (barWidth && bgWidth && barWidth > bgWidth)
                            Log.throwError("进度条宽度大于底图宽度，请确认", item.name);
                    }
                }
            }
        }
    }
}