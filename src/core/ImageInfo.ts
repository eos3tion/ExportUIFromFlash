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
     * 装箱后得到的坐标
     */
    public fit: { x: number, y: number };

    private _data: ImageData;

    constructor(data?: ImageData) {
        this._data = data || <ImageData>{ refs: [] };
    }

    public setIdx(idx: number) {
        this._data.idx = idx;
    }

    /**
     * 导出时，图片的索引号
     */
    public getIdx() {
        return this._data.idx;
    }

    /**
     * 图片在库中的名字
     */
    public getName() {
        return this._data.name;
    }
    /**
     * 设置图片在库中的名字
     */
    public setName(value: string) {
        this._data.name = value;
    }


    /**
     * 设置库中对应的图片
     */
    public setLibItem(value: FlashBitmapItem) {
        this._data.libItem = value;
    }
    /**
     * 库中对应的图片
     */
    public getLibItem() {
        return this._data.libItem;
    }

    /**
     * 添加引用对象，用于调试
     * 
     * @param {FlashItem} libItem
     */
    public addRef(libItem: FlashItem) {
        const refs = this._data.refs;
        if (!~refs.indexOf(libItem)) {
            refs.push(libItem);
        }
    }
    /**
     * 设置是否含有透明通道
     */
    public setIsPng(value: boolean) {
        this._data.isPng = value;
    }
    /**
     * 是否含有透明通道
     */
    public getIsPng() {
        return this._data.isPng;
    }

    /**
     * 设置是否含有透明通道
     */
    setIndexInfo(info: ImageIndexInfo) {
        this._data.indexInfo = info;
    }
    /**
     * 是否含有透明通道
     */
    getIndexInfo() {
        return this._data.indexInfo;
    }

    public getIndex() {
        const data = this._data;
        const indexInfo = data.indexInfo;
        if (data.isPng) {
            return indexInfo.pngindex;
        } else {
            return -1 - indexInfo.jpgindex;
        }
    }
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
        let img = new ImageInfo(this._data);
        img.w = this.w;
        img.h = this.h;
        let fit = this.fit;
        if (fit) {
            img.fit = { x: fit.x, y: fit.y };
        }
        return img;
    }
}

interface ImageData {
    /**
     * 导出时，图片的索引号
     */
    idx: number;
    /**
     * 图片在库中的名字
     */
    name: string;
    /**
     * 库中对应的图片
     */
    libItem: FlashBitmapItem;
    /**
     * 引用此图片的元件
     */
    refs: FlashItem[];

    /**
     * 是否含有透明通道
     */
    isPng: boolean;

    /**
     * 索引信息
     */
    indexInfo: ImageIndexInfo;
}