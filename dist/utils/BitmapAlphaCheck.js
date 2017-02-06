/**
 * 检测图片是否有透明通道
 */
var BitmapAlphaCheck = (function () {
    function BitmapAlphaCheck() {
    }
    BitmapAlphaCheck.checkAlpha = function (bitmap, img) {
        var bits = bitmap.getBits().bits;
        var len = bits.length;
        var ispng;
        for (var i = 1; i < len; i += 2) {
            if ((bits.charCodeAt(i) & 0xff00) != 0xff00) {
                ispng = img.ispng = true;
                break;
            }
        }
        var item = bitmap.libraryItem;
        item.allowSmoothing = true;
        if (ispng) {
            item.compressionType = "lossless"; //png
        }
        else {
            item.compressionType = "photo"; //jpg
            item.quality = 80;
            img.quality = 80;
        }
    };
    return BitmapAlphaCheck;
}());
