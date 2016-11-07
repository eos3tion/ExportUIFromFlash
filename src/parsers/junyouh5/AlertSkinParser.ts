/**
 * 提示框皮肤解析器
 * 
 * @class AlertSkinParser
 * @extends {ComWillCheck}
 * @author pb
 */
class AlertSkinParser extends ComWillCheck {
    constructor() {
        super(ExportType.AlertSkin, /^ui[.](alert)/, null, "sui.Alert");
        this.parseHandler = this.alertSkinParser;
    }
    /**
     * 用于处理提示框
     */
    private alertSkinParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        // 检查提示框的帧
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
        // 遍历图层
        for (let i = 0; i < len; i++) {
            layer = layers[i];
            name = layer.name;
            if (name) {
                frame = layer.frames[0];
                elements = frame.elements;
                let e = elements[0];
                // 底图
                if (name === "bg") {
                    data[0] = solution.getElementData(e);
                }
                // 文本
                else if (name === "tf") {
                    data[1] = solution.getElementData(e);
                }
                // title
                else if (name === "title") {
                    data[2] = solution.getElementData(e);
                }
                // 关闭按钮
                else if (name === "close") {
                    data[3] = solution.getElementData(e);
                }
                // 复选按钮
                else if (name === "check") {
                    data[4] = solution.getElementData(e);
                }
                // 退出按钮
                else if (name === "cancel") {
                    data[5] = solution.getElementData(e);
                }
                // 确认按钮
                else if (name === "ok") {
                    data[6] = solution.getElementData(e);
                }
            }
        }
    }
}