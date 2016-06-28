class ProgressBarParser extends ComWillCheck {
    constructor() {
        super(ExportType.ProgressBar, /^ui[.](progress)/, null, "ProgressBar");
        this.parseHandler = this.progressBarParser;
    }
    /**
     * 用于处理进度条
     */
    private progressBarParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        // 检查进度条的帧
        let timeline = item.timeline;
        let layers = timeline.layers;
        let len = layers.length;
        let data = [];
        list[item.$idx] = data;

        let layer;
        let name;
        let frame;
        let elements;
        let barWidth;
        for (let i = 0; i < len; i++) {
            layer = layers[i];
            name = layer.name;

            if (name === "tf") {
                frame = layer.frames[0];
                elements = frame.elements;
                let tf = elements[0];
                if (tf && tf.elementType === "text") {
                    data[0] = solution.getElementData(tf);
                }
            } else if (name === "bar") {
                frame = layer.frames[0];
                elements = frame.elements;
                let bar = elements[0];
                let barData = solution.getElementData(bar);
                data[1] = barData;
                if (barData)
                    barWidth = barData[1][3];
                else
                    Log.throwError("进度条宽度未设置，请确认", item.name);
            }
            else if (name === "bg") {
                frame = layer.frames[0];
                elements = frame.elements;
                let bg = elements[0];
                if (bg.elementType === "instance" && bg.instanceType === "bitmap") {
                    let bgData = solution.getElementData(bg);
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