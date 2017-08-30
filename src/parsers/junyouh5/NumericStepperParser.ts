class NumericStepperParser extends ComWillCheck {
    constructor() {
        super(ExportType.NumericStepper, /^ui[.](numstep)[.]/, null, "NumericStepper");
    }

    doParser(item: FlashItem, solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];
        for (let i = 0; i < llen; i++) {
            data[i] = 0;
        }
        // 遍历图层
        for (let i = 0; i < llen; i++) {
            let layer = layers[i];
            let frame = layer.frames[0];
            let elements = frame.elements;
            if (elements.length == 0) {
                continue;
            }
            let ele = elements[0];
            switch (layer.name) {
                case "tf":
                    data[0] = solution.getElementData(ele);
                    break;
                case "bg":
                    data[1] = solution.getElementData(ele);
                    break;
                case "min":
                    data[2] = solution.getElementData(ele);
                    break;
                case "minus":
                    data[3] = solution.getElementData(ele);
                    break;
                case "add":
                    data[4] = solution.getElementData(ele);
                    break;
                case "max":
                    data[5] = solution.getElementData(ele);
                    break;
                default:
                    break;
            }

            // if (len > 1)
            // {
            //     for (let i = 0; i < len; i++) {
            //         ele = elements[i];
            //         data[i + 1] = solution.getElementData(ele);
            //     }
            // }
            // else {
            //     ele = elements[0];
            //     if(ele && ele.elementType == "text")
            //         data[0] = solution.getElementData(ele);
            //     else
            //         Log.throwError("数值设置器NumericStepper未设置文本，请确认", item.name);
            // }
        }
        return data;
    }
}