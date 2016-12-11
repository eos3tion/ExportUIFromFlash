var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NumericStepperParser = (function (_super) {
    __extends(NumericStepperParser, _super);
    function NumericStepperParser() {
        var _this = _super.call(this, 7 /* NumericStepper */, /^ui[.](numstep)/, null, "sui.NumericStepper") || this;
        _this.parseHandler = _this.NumericStepperParser;
        return _this;
    }
    NumericStepperParser.prototype.NumericStepperParser = function (checker, item, list, solution) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        var data = [];
        list[item.$idx] = data;
        for (var i = 0; i < llen; i++) {
            data[i] = 0;
        }
        // 遍历图层
        for (var i = 0; i < llen; i++) {
            var layer = layers[i];
            var frame = layer.frames[0];
            var elements = frame.elements;
            if (elements.length == 0) {
                continue;
            }
            var ele = elements[0];
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
        }
    };
    return NumericStepperParser;
}(ComWillCheck));
