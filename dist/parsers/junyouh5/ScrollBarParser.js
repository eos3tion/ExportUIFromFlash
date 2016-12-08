var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ScrollBarParser = (function (_super) {
    __extends(ScrollBarParser, _super);
    function ScrollBarParser() {
        _super.call(this, 9 /* Scroll */, /^ui[.](scroll)/, null, "sui.ScrollBar");
        this.parseHandler = this.scrollBarParser;
    }
    ScrollBarParser.prototype.scrollBarParser = function (checker, item, list, solution) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var data = [];
        list[item.$idx] = data;
        if (layers.length != 2) {
            Log.throwError("scroll必须且只能有2个图层", item.name);
            return;
        }
        var layer = layers[0];
        var frame = layer.frames[0];
        var element = frame.elements[0];
        data[0] = solution.getElementData(element);
        layer = layers[1];
        frame = layer.frames[0];
        element = frame.elements[0];
        data[1] = solution.getElementData(element);
    };
    return ScrollBarParser;
}(ComWillCheck));
