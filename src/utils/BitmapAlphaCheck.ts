/**
 * 检测图片是否有透明通道
 */
class BitmapAlphaCheck {


    public static checkAlpha(bitmap: FlashElement, img: ImageInfo) {
        let bits = bitmap.getBits().bits;
        let len = bits.length;
        let ispng = false;
        if (checkJPG) {
            //bits 按utf-16形式存储
            //解出来 gr ab 
            for (let i = 1; i < len; i += 2) {
                if ((bits.charCodeAt(i) & 0xff00) != 0xff00) {
                    ispng = true;
                    break;
                }
            }
        } else {
            ispng = true;
        }
        img.setIsPng(ispng);
        let item = bitmap.libraryItem;
        item.allowSmoothing = false;
    }
}