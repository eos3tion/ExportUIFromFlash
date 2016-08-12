class NumericStepperParser extends ComWillCheck {
    constructor() {
        super(ExportType.NumericStepper, /^ui[.](numstep)/, null, "sui.NumericStepper");
        this.parseHandler = this.NumericStepperParser;
    }

    private NumericStepperParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];

        list[item.$idx] = data;

        // 遍历图层
        for (let i = 0; i < llen; i++) {
            let layer = layers[i];
            let frame = layer.frames[0];
            let elements = frame.elements;
            let len = elements.length;
            let ele;
            if (len > 1)
            {
                for (let i = 0; i < len; i++) {
                    ele = elements[i];
                    data[i + 1] = solution.getElementData(ele);
                }
            }
            else {
                ele = elements[0];
                if(ele && ele.elementType == "text")
                    data[0] = solution.getElementData(ele);
                else
                    Log.throwError("数值设置器NumericStepper未设置文本，请确认", item.name);
            }
        }
    }
}