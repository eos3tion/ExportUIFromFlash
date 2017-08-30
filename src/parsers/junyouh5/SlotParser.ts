/**
 * 格位解析器
 * 
 * @class SlotParser
 * @extends {ComWillCheck}
 * @author pb
 */
class SlotParser extends ComWillCheck {
    constructor() {
        super(ExportType.Slot, /^ui[.](slot)[.]/, null, "Slot");
    }
    /**
     * 用于处理格位
     * 支持2图层 bg tf
     * 支持1图层 tf
     * 必须有九宫线
     */
    doParser(item: FlashItem, solution: Solution) {
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
        //九宫信息
        let gridRect = item.scalingGridRect;
        let gx = Math.round(gridRect.left);
        let gy = Math.round(gridRect.top);
        let gr = Math.round(gridRect.right);
        let gb = Math.round(gridRect.bottom);
        data[0] = [gx, gy, gr - gx, gb - gy];

        // 遍历图层
        for (let i = 0; i < len; i++) {
            let layer = layers[i];
            let name = layer.name;
            if (name) {
                let frame = layer.frames[0];
                let elements = frame.elements;
                let e = elements[0];
                //文本
                if (name === "tf") {
                    data[1] = solution.getElementData(e);
                }
                // 底图 无底图时不处理
                else if (name === "bg") {
                    data[2] = solution.getElementData(e);
                }
            }
        }
        return data;
    }
}