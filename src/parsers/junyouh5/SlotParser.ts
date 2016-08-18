/**
 * 格位解析器
 * 
 * @class SlotParser
 * @extends {ComWillCheck}
 * @author pb
 */
class SlotParser extends ComWillCheck {
    constructor() {
        super(ExportType.Slot, /^ui[.](slot)/, null, "sui.Slot");
        this.parseHandler = this.slotParser;
    }
    /**
     * 用于处理格位
     * 支持2图层 bg tf
     * 支持1图层 tf
     * 必须有九宫线
     */
    private slotParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        // 检查帧
        let timeline = item.timeline;
        // 多图层
        let layers = timeline.layers;
        let len = layers.length;
        if (len > 2) {
            Log.throwError("slot最多可有两个图层", item.name);
            return;
        }
        let sacle9 = item.scalingGrid;
        if (!sacle9) {
            Log.throwError("此控件没有设置九宫信息", item.name);
            return;
        }

        let data = [];
        list[item.$idx] = data;
        //九宫信息
        let gridRect = item.scalingGridRect;
        var gx = Math.round(gridRect.left);
        var gy = Math.round(gridRect.top);
        var gr = Math.round(gridRect.right);
        var gb = Math.round(gridRect.bottom);
        data[0] = [gx, gy, gr - gx, gb - gy];

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
                    data[1] = solution.getElementData(e);
                }
                // 底图 无底图时不处理
                else if (e.elementType === "instance" && e.instanceType === "bitmap") {
                    let bgData = solution.getElementData(e);
                    data[2] = bgData;
                    //alert(bgData);
                }
            }
        }
    }
}