/**
 * 图片数据
 * @author 3tion
 */
class ImageInfo implements IBlock {
    /**
     * 图片宽度
     */
    public w: number;
    /**
     * 图片高度
     */
    public h: number;
    /**
     * 导出时，图片的索引号
     */
    public idx: number;
    /**
     * 图片在库中的名字
     */
    public name: string;
    /**
     * 库中对应的图片
     */
    public libItem: FlashBitmapItem;
    /**
     * 引用此图片的元件
     */
    public refs: FlashItem[] = [];
    /**
     * 装箱后得到的坐标
     */
    public fit: {x: number, y: number};
    /**
     * 获取图片的面积
     */
    public getArea() {
        return this.w * this.h;
    }
    /**
     * 获取导出的数据
     */
    public toExport() {
        let fit = this.fit;
        return [this.w, this.h, fit.x, fit.y];
    }
    /**
     * 创建一份副本
     */
    public clone() {
        let img = new ImageInfo();
        img.w = this.w;
        img.h = this.h;
        img.libItem = this.libItem;
        img.name = this.name;
        img.refs = this.refs;
        let fit = this.fit;
        if (fit) {
            img.fit = { x: fit.x, y: fit.y };
        }
        return img;
    }
}