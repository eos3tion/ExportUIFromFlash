/**
 * 对图片进行处理
 * 
 * @class ImageParser
 */
class ImageParser {
    /**
    * 图片数据的字典
    * Key      {string}        图片在库中的名字
    * Value    {ImageInfo}     图片信息
    */
    public bitmaps: { [index: string]: ImageInfo };

    constructor() {
        this.bitmaps = {};
    }

    /**
     * 检查库中的Item
     * 
     * @param {FlashItem} libItem 库中的Item
     * @param {ImageInfo[]} blocks 用于传出的ImageInfo对象
     */
    public checkItem(libItem: FlashItem, blocks: ImageInfo[], solution: Solution) {
        if (libItem.linkageImportForRS) {//原件是导入的，不检查 
            return;
        }
        let bitmaps = this.bitmaps;
        // 遍历timeline
        let timeline = libItem.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        if (llen == 2) {//层数有两层的做特殊检测
            // BitmapSlice9.jsfl处理过的图片，做特殊处理
            let {layer, error} = solution.getScaleBitmapLayer(layers, libItem);
            if (layer) {
                let flag = true;
                let frames = layer.frames;
                if (frames.length > 1) {
                    Log.throwError("BitmapSlice9.jsfl处理的九宫图元件引导帧数多余一帧", libItem.name);
                    return;
                }
                let elements = frames[0].elements;
                if (elements.length > 1) {
                    Log.throwError("BitmapSlice9.jsfl处理的九宫图元件引导层只能引用一张位图", libItem.name);
                    return;
                }
                let ele = elements[0];
                solution.addImageToLib(ele, libItem);
                return;
            }
        }
        for (let li = 0; li < llen; li++) {
            let layer = layers[li];
            let ltype = layer.layerType;
            if (ltype === LayerType.Normal) { // 只处理普通层
                let frames = layer.frames;
                let flen = frames.length;
                for (let fi = 0; fi < flen; fi++) {
                    let frame = frames[fi];
                    if (frame.startFrame !== fi) { // 非关键帧不处理
                        continue;
                    }
                    let elements = frame.elements;
                    let elen = elements.length;
                    for (let ei = 0; ei < elen; ei++) {
                        let ele = elements[ei];
                        let elementType = ele.elementType;
                        if (elementType === "instance") { // 实例对象
                            let instanceType = ele.instanceType;
                            if (instanceType === "bitmap") { // 如果是位图的实例，尝试导出
                                solution.addImageToLib(ele, libItem);
                            } else if (instanceType === "symbol") {
                                let bItem = ele.libraryItem;
                                if (!bItem.linkageClassName) {
                                    this.checkItem(bItem, blocks, solution);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 解析Image，获取图片数据和装箱后的图片文件
     * 
     * @param {IBlockPacker} packer 装箱器
     * @param {ImageInfo[]} blocks 带装箱的图片
     * @return 对应的数据 ImageInfo.prototype.toExport()的数据
     * @see ImageInfo.prototype.toExport
     */
    public parse(packer: IBlockPacker, blocks: ImageInfo[]) {
        let results: Result[] = [];
        let len = blocks.length;
        if (!len) {//增加没有导出图片的情况
            return undefined;
        }
        if (typeof packer.setWidth == "function") {//需要预设大小的装箱处理解析器
            //得到图片的最大宽度
            let maxWidth = 0;
            let total = 0;
            for (let i = 0; i < len; i++) {
                let block = blocks[i];
                let w = block.w;
                total += w;
                if (w > maxWidth) {
                    maxWidth = w;
                }
            }
            //从最宽的一个 到总宽度的 进行遍历设置
            for (let w = maxWidth; w <= total; w++) {
                packer.setWidth(w);
                Log.trace("正在使用宽度：", w);
                this.doPacking(blocks, "setWidth:" + w, packer, results);
            }

        } else {
            // 先打乱顺序
            for (let ki = 0; ki < len; ki++) {
                let nb = this.idxHandler(ki, blocks);
                this.doPacking(nb, "areaI" + ki, packer, results);
            }

            // 使用基础排序尝试
            let baseSorts = sort.baseSorts,
                bi = 0,
                blen = baseSorts.length;
            for (; bi < blen; bi++) {
                let skey = baseSorts[bi];
                let sHandler = sort[skey];
                blocks.sort(sHandler);
                this.doPacking(blocks, skey, packer, results);
            }

            // 再来100次乱序
            for (let t = 0; t < 100; t++) {
                blocks.sort(sort.random);
                this.doPacking(blocks, "random" + t, packer, results);
            }
        }
        results.sort(function (a, b) {
            return a.fit - b.fit;
        });
        // 得到面积最小的结果
        let result = results[0];

        return this.exportImage(result.blocks);
    }
    /**
     * 将快信息导出成图片
     */
    private exportImage(result: ImageInfo[]) {
        let bitmaps = this.bitmaps;
        let imgDatas = [];
        let tname = "$$$temp";
        if (lib.itemExists(tname)) {
            lib.deleteItem(tname);
        }
        // 创建一个新的原件
        lib.addNewItem("movie clip", tname);
        lib.editItem(tname);

        // 将info中数据放入这个
        for (let k = 0, len = result.length; k < len; k++) {
            let block = result[k];
            imgDatas[k] = block.toExport();
            bitmaps[block.name] = block;
            block.idx = k;
            let fit = block.fit;
            if (fit) {
                let hw = block.w * 0.5;
                let hh = block.h * 0.5;
                let pos = {
                    x: fit.x + hw,
                    y: fit.y + hh
                };
                while (!lib.addItemToDocument(pos, block.name));
                dom.mouseClick(pos, false, true);
                dom.setElementProperty("x", fit.x);
                dom.setElementProperty("y", fit.y);
            } else {
                Log.trace("noFit", JSON.stringify(block));
            }
        }

        /********将图片拼合，并导出********/
        dom.selectAll();
        dom.convertSelectionToBitmap();
        let ele = dom.selection[0];
        if (!ele) {
            Log.throwError("没有成功拼合图片");
        }
        let bitmap = ele.libraryItem;

        // 导出的文件路径
        let exname = folder + PNG_FILE;
        bitmap.exportToFile(exname);
        // 删除临时文件
        // 图片导出之前，删除操作会失败，所以加了while
        while (!lib.deleteItem(bitmap.name)) { }
        while (!lib.deleteItem(tname)) { }

        FLExternal.pngquant(exname);

        // 导出图片数据
        return imgDatas;
    }

    /**
     * 按指定索引，重新排列顺序
     * [0,1,2,3,4,5,6,7]
     * 如果索引使用3，则输出[3,4,5,6,7,0,1,2]
     * @private
     * @param {number}      idx          指定的索引
     * @param {ImageInfo[]} blocks       图片集合
     * @returns 处理后的数组
     */
    private idxHandler(idx: number, blocks: ImageInfo[]) {
        let len = blocks.length;
        let nb: ImageInfo[] = [];
        let pi = 0;
        for (let ii = idx; ii < len; ii++) {
            nb[pi++] = blocks[ii];
        }
        for (let ni = 0; ni < idx; ni++) {
            nb[pi++] = blocks[ni];
        }
        return nb;
    }

    /**
     * 进行装箱
     * 
     * @param {ImageInfo[]} inputs 要装箱的图片数据
     * @param {string} key 排序算法的标识
     * @param {IBlockPacker} packer 装箱算法
     * @param {Result[]} results 结果集合
     */
    private doPacking(inputs: ImageInfo[], key: string, packer: IBlockPacker, results: Result[]) {
        let len = inputs.length;
        let blocks = <ImageInfo[]>packer.fit(inputs);
        if (!blocks) {
            return;
        }
        if (len != blocks.length) {
            Log.trace("装箱时，有Block没被装箱，请检查！", len, blocks.length);
            return;
        }
        Log.trace("开始添加结果集");
        let result: Result = {
            key: key,
            blocks: [],
            fit: 0
        };
        let block: ImageInfo, n;
        let noFit = false;
        let width = 0;
        let height = 0;
        for (n = 0; n < len; n++) {
            block = blocks[n];
            if (block.fit) {
                result.blocks.push(block.clone());
                //fit += block.getArea();
                let right = block.fit.x + block.w;
                if (right > width) {
                    width = right;
                }
                let bottom = block.fit.y + block.h;
                if (bottom > height) {
                    height = bottom;
                }
            } else {
                noFit = true;
                break;
            }
        }
        result.fit = width * height;
        if (noFit) {
            Log.trace(result.key + "noFit");
        } else {
            results.push(result);
            Log.trace(result.key + ":" + result.fit);
        }
    }
}

let sort = {
    /**
     * 基础的排序标识
     */
    baseSorts: ["a", "area", "h", "height", "max", "maxside", "min", "w", "width"],

    random: function (a: IBlock, b: IBlock) {
        return Math.random() - 0.5;
    },
    w: function (a: IBlock, b: IBlock) {
        return b.w - a.w;
    },
    h: function (a: IBlock, b: IBlock) {
        return b.h - a.h;
    },
    a: function (a: IBlock, b: IBlock) {
        return b.getArea() - a.getArea();
    },
    max: function (a: IBlock, b: IBlock) {
        return Math.max(b.w, b.h) - Math.max(a.w, a.h);
    },
    min: function (a: IBlock, b: IBlock) {
        return Math.min(b.w, b.h) - Math.min(a.w, a.h);
    },
    height: function (a: IBlock, b: IBlock) {
        return sort.msort(a, b, ["h", "w"]);
    },
    width: function (a: IBlock, b: IBlock) {
        return sort.msort(a, b, ["w", "h"]);
    },
    area: function (a: IBlock, b: IBlock) {
        return sort.msort(a, b, ["a", "h", "w"]);
    },
    maxside: function (a: IBlock, b: IBlock) {
        return sort.msort(a, b, ["max", "min", "h", "w"]);
    },
    msort: function (a: IBlock, b: IBlock, criteria) { /* sort by multiple criteria */
        let diff: number, n;
        for (n = 0; n < criteria.length; n++) {
            diff = sort[criteria[n]](a, b);
            if (diff !== 0)
                return diff;
        }
        return 0;
    }
};

interface Result {
    key: string;
    blocks: ImageInfo[];
    fit: number;
};