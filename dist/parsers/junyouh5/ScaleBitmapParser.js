var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ScaleBitmapParser = (function (_super) {
    __extends(ScaleBitmapParser, _super);
    function ScaleBitmapParser() {
        _super.call(this, 5 /* ScaleBmp */, /^bmd[.](scale9)/, null, "sui.ScaleBitmap");
        this.parseHandler = this.scaleBitmapParser;
    }
    ScaleBitmapParser.prototype.scaleBitmapParser = function (checker, item, list, solution) {
        list[item.$idx] = solution.getScaleBitmapData(item);
    };
    return ScaleBitmapParser;
}(ComWillCheck));
