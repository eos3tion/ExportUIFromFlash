/**
 * 图片数据
 * @author 3tion
 */
var ImageInfo = (function () {
    function ImageInfo() {
        /**
         * 引用此图片的元件
         */
        this.refs = [];
    }
    /**
     * 获取图片的面积
     */
    ImageInfo.prototype.getArea = function () {
        return this.w * this.h;
    };
    /**
     * 获取导出的数据
     */
    ImageInfo.prototype.toExport = function () {
        var fit = this.fit;
        return [this.w, this.h, fit.x, fit.y];
    };
    /**
     * 创建一份副本
     */
    ImageInfo.prototype.clone = function () {
        var img = new ImageInfo();
        img.w = this.w;
        img.h = this.h;
        img.libItem = this.libItem;
        img.name = this.name;
        img.refs = this.refs;
        var fit = this.fit;
        if (fit) {
            img.fit = { x: fit.x, y: fit.y };
        }
        return img;
    };
    return ImageInfo;
}());
