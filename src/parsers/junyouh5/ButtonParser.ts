class ButtonParser extends ComWillCheck {
    constructor() {
        super(ExportType.Button, /^ui[.](btn|tab|checkbox|radiobox)[.]/, null, "Button");
    }
    /**
     * 用于处理按钮
     */
    doParser(item: FlashItem, solution: Solution) {
        // 检查按钮的帧
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];
        // 使用导出名作为key
        // 按钮必须1层或者2层
        // 层名字为label 放文本框或者留空
        // 层名字为bg 放3帧或者4帧图片
        // 默认无文本框 
        data[0] = 0; //赋值为0的目的是如果没有文本，会输出为undefined，字符串比0长
        for (let li = 0; li < llen; li++) {
            let layer = layers[li];
            let lname = layer.name;
            if (lname === "tf") {
                let frame = layer.frames[0];
                let elements = frame.elements;
                let tf = elements[0];
                if (tf && tf.elementType === "text") {
                    data[0] = solution.getElementData(tf);
                }
            } else if (lname === "bg") {
                let flen = Math.min(4, layer.frames.length); // 最多4帧
                for (let fi = 0; fi < flen; fi++) {
                    let frame = layer.frames[fi];
                    data[fi + 1] = 0;
                    if (frame.startFrame !== fi) // 非关键帧不处理
                    {
                        continue;
                    }
                    let elements = frame.elements;
                    let elen = elements.length;
                    for (let ei = 0; ei < elen; ei++) {
                        let ele = elements[ei];
                        if (ele && ele.elementType === "instance" && (ele.instanceType === "bitmap" || /^bmd[.]/.test(ele.libraryItem.linkageClassName))) {
                            data[fi + 1] = solution.getElementData(ele);
                        }
                    }
                }
            } else if (lname === "floor") { // 新增附加底层
                let frame = layer.frames[0];
                let elements = frame.elements;
                let ele = elements[0];
                if (ele && ele.elementType === "instance") {
                    data[5] = solution.getElementData(ele);
                }
            } else if (lname === "ceil") { // 新增附加顶层，盖子
                let frame = layer.frames[0];
                let elements = frame.elements;
                let ele = elements[0];
                if (ele && ele.elementType === "instance") {
                    if (data.length < 6) {
                        data[5] = 0;
                    }
                    data[6] = solution.getElementData(ele);
                }
            } else {
                Log.throwError("不支持这种按钮：", item.name);
            }
        }
        return data;
    }
}