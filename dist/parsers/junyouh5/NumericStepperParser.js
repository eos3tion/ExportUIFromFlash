var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NumericStepperParser = (function (_super) {
    __extends(NumericStepperParser, _super);
    function NumericStepperParser() {
        _super.call(this, ExportType.NumericStepper, /^ui[.](numstep)/, null, "sui.NumericStepper");
        this.parseHandler = this.NumericStepperParser;
    }
    NumericStepperParser.prototype.NumericStepperParser = function (checker, item, list, solution) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        var data = [];
        list[item.$idx] = data;
        // 遍历图层
        for (var i = 0; i < llen; i++) {
            var layer = layers[i];
            var frame = layer.frames[0];
            var elements = frame.elements;
            var len = elements.length;
            var ele = void 0;
            if (len > 1) {
                for (var i_1 = 0; i_1 < len; i_1++) {
                    ele = elements[i_1];
                    data[i_1 + 1] = solution.getElementData(ele);
                }
            }
            else {
                ele = elements[0];
                if (ele && ele.elementType == "text")
                    data[0] = solution.getElementData(ele);
                else
                    Log.throwError("数值设置器NumericStepper未设置文本，请确认", item.name);
            }
        }
    };
    return NumericStepperParser;
}(ComWillCheck));
