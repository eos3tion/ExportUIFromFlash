interface ImageDatas {
    /**
     * jpg和png在一张图的数据
     * 
     * @type {number[][]}
     * @memberOf ImageDatas
     */
    compose?: number[][];

    /**
     * jpg的图片的纹理数据
     * 
     * @type {number[][]}
     * @memberOf ImageDatas
     */
    jpg?: number[][];

    /**
     * png的图片的纹理数据
     * 
     * @type {number[][]}
     * @memberOf ImageDatas
     */
    png?: number[][];
}

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

    private imgDatas: ImageDatas;

    private rawBlocks: ImageInfo[];

    // private tempComposeImgDatas: any;

    /**用于存储jpg png索引的临时数据 */
    private tempIndexDic: { [index: string]: ImageIndexInfo };

    constructor() {
        this.bitmaps = {};
        this.imgDatas = {};
        this.tempIndexDic = {};
        // this.tempComposeImgDatas = [];
    }

    /**
     * 检查库中的Item
     * 
     * @param {FlashItem} libItem 库中的Item
     * @param {ImageInfo[]} blocks 用于传出的ImageInfo对象
     */
    public checkItem(libItem: FlashItem, blocks: ImageInfo[], solution: Solution) {
        this.rawBlocks = blocks;
        if (libItem.linkageImportForRS) {//原件是导入的，不检查 
            return;
        }
        // 遍历timeline
        let timeline = libItem.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        if (llen == 2) {//层数有两层的做特殊检测
            // BitmapSlice9.jsfl处理过的图片，做特殊处理
            let { layer, error } = solution.getScaleBitmapLayer(layers, libItem);
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
        const self = this;
        let pngblocks: ImageInfo[] = [];
        let jpgblocks: ImageInfo[] = [];
        let arr = [];
        for (let i = 0; i < len; i++) {
            let info = blocks[i];
            if (info.getIsPng()) {
                pngblocks.push(info);
            } else {
                jpgblocks.push(info);
            }
        }
        const imgDatas = this.imgDatas;
        let re = getResult(blocks, packer);
        let { datas, bitmap } = getImage(re, "pngindex");
        fl.trace("datas:\n" + JSON.stringify(datas));
        if (jpgblocks.length == 0) {//没有任何jpg
            // 直接生成数据
            this.exportPng(bitmap, folder + PNG_FILE);
            imgDatas.png = datas;
        } else {
            let composeurl = folder + "compose" + PNG_FILE;
            let pngurl = folder + PNG_FILE;
            let jpgurl = folder + JPG_FILE;
            this.exportPng(bitmap, composeurl);
            let pngData, pngsize = 0;
            if (pngblocks.length) {
                re = getResult(pngblocks, packer);
                pngData = getImage(re, "pngindex");
                this.exportPng(pngData.bitmap, pngurl);
                pngsize = FLfile.getSize(pngurl);
            }

            re = getResult(jpgblocks, packer);
            let jpgData = getImage(re, "jpgindex");
            this.exportJpg(jpgData.bitmap);

            let jpgsize = FLfile.getSize(jpgurl);
            let composesize = FLfile.getSize(composeurl);
            let total = jpgsize + pngsize + 100;//100差不多为多一次http请求的字节数
            Log.trace("组合图片的大小：", composesize, "拆分后，jpg大小：", jpgsize, "png大小：", pngsize);
            if (total < composesize) {
                //分开的更小,删除组合的
                this.removeImage(composeurl);
                FLfile.remove(folder + Extension.Jpng);
                imgDatas.png = pngData && pngData.datas;
                imgDatas.jpg = jpgData.datas;
            } else {
                this.removeImage(pngurl);
                FLfile.copy(composeurl, pngurl);
                FLfile.copy(composeurl + Extension.Webp, pngurl + Extension.Webp);
                this.removeImage(composeurl);
                //删除多余的png jpg 保留组合的图片
                this.removeImage(jpgurl);
                FLfile.remove(folder + Extension.Jpng);
                imgDatas.png = datas;
            }
        }

        let raw = this.rawBlocks;
        let copy = this.tempIndexDic;

        for (let r of raw) {
            let c = copy[r.getName()];
            if (c) {
                r.setIndexInfo(c);
            }
        }

        return imgDatas;
        function getResult(blocks: ImageInfo[], packer: IBlockPacker) {
            if (typeof packer.setWidth == "function") {//需要预设大小的装箱处理解析器
                //得到图片的最大宽度
                let maxWidth = 0;
                let total = 0;
                for (let i = 0; i < blocks.length; i++) {
                    let block = blocks[i];
                    let w = block.w;
                    total += w;
                    if (w > maxWidth) {
                        maxWidth = w;
                    }
                }
                total = Math.min(Const.MaxSize, total);
                //从最宽的一个 到总宽度的 进行遍历设置
                for (let w = maxWidth; w <= total; w++) {
                    packer.setWidth(w);
                    //Log.trace("正在使用宽度：", w);
                    let keyPre = "setWidth:" + w;
                    if (packer.selfSorting) {
                        self.doPacking(blocks, keyPre, packer, results, w);
                    } else {
                        packingForSort(blocks, packer, results, keyPre);
                    }
                }
            } else {
                if (packer.selfSorting) {
                    self.doPacking(blocks, "", packer, results);
                } else {
                    packingForSort(blocks, packer, results);
                }
            }
            if (!results.length) {
                Log.throwError("装箱操作，没有一个得到一个合法的结果");
                return;
            }
            // 得到面积最小的结果
            let minRe: Result, min = Infinity;
            for (let i = 0; i < results.length; i++) {
                let re = results[i];
                if (re.fit < min) {
                    min = re.fit;
                    minRe = re;
                }
            }
            let minBlocks = minRe.blocks;
            if (!minBlocks && minRe.param) {
                packer.setWidth(minRe.param);
                let inBlock = [];
                for (let i = 0; i < blocks.length; i++) {
                    inBlock[i] = blocks[i].clone();
                }
                minBlocks = packer.fit(inBlock) as ImageInfo[];
            }
            return minBlocks;
        }

        function packingForSort(blocks: ImageInfo[], packer: IBlockPacker, results: Result[], keyPre = "") {
            let len = blocks.length;
            // 先打乱顺序
            for (let ki = 0; ki < len; ki++) {
                let nb = self.idxHandler(ki, blocks);
                self.doPacking(nb, keyPre + "areaI" + ki, packer, results);
            }

            // 使用基础排序尝试
            let baseSorts = sort.baseSorts,
                bi = 0,
                blen = baseSorts.length;
            for (; bi < blen; bi++) {
                let skey = baseSorts[bi];
                let sHandler = sort[skey];
                blocks.sort(sHandler);
                self.doPacking(blocks, keyPre + skey, packer, results);
            }

            // 再来1000次乱序
            for (let t = 0; t < 1000; t++) {
                blocks.sort(sort.random);
                self.doPacking(blocks, keyPre + "random" + t, packer, results);
            }
        }

        /**
         * 将快信息合成图片
         * @param iscompose 是否不拆分直接导出成一张png
         */
        function getImage(result: ImageInfo[], key: "jpgindex" | "pngindex") {
            let bitmaps = self.bitmaps;
            const tempIndexDic = self.tempIndexDic;
            let tname = "$$$temp";
            while (lib.itemExists(tname)) {
                lib.deleteItem(tname);
            }
            // 创建一个新的原件
            while (!lib.addNewItem("movie clip", tname));
            lib.editItem(tname);

            // 将info中数据放入这个
            let datas: number[][] = [];
            for (let k = 0, len = result.length; k < len; k++) {
                let block = result[k];
                let kname = block.getName();
                let tmp = tempIndexDic[kname];
                if (!tmp) {
                    tmp = <ImageIndexInfo>{};
                    tmp.name = kname;
                    tempIndexDic[kname] = tmp;
                    block.setIdx(k);
                }
                tmp[key] = k;
                datas[k] = block.toExport();

                let item = block.getLibItem();
                item.allowSmoothing = false;
                item.compressionType = "lossless";

                bitmaps[kname] = block;
                let fit = block.fit;
                if (fit) {
                    let hw = block.w * 0.5;
                    let hh = block.h * 0.5;
                    let pos = {
                        x: fit.x + hw,
                        y: fit.y + hh
                    };
                    lib.addItemToDocument(pos, kname);
                    dom.mouseClick(pos, false, true);
                    dom.setElementProperty("x", fit.x);
                    dom.setElementProperty("y", fit.y);
                } else {
                    Log.trace("noFit", JSON.stringify(block));
                }
            }

            /********将图片拼合，并导出********/
            dom.selectAll();
            if (dom.selection.length) {
                while (!dom.convertSelectionToBitmap());
                let ele = dom.selection[0];
                if (!ele) {
                    Log.throwError("没有成功拼合图片");
                }
                let bitmap = ele.libraryItem;
                bitmap.allowSmoothing = false;
                bitmap.compressionType = "lossless";

                while (!lib.deleteItem(tname));
                return { datas, bitmap };
            } else {
                Log.throwError(key, "没有任何元素");
            }
        }
    }

    private removeImage(name: string) {
        FLfile.remove(name);
        if (exportRaw || flaname == "lib") {//lib保存原始文件
            FLfile.remove(name + Extension.Raw);
        }
        if (exportWebp) {
            FLfile.remove(name + Extension.Webp);
        }
    }

    private exportJpg(bitmap: FlashItem) {
        let pngJ = folder + Extension.Jpng;
        let jpg = folder + JPG_FILE;
        this.exportImage(bitmap, pngJ);
        this.exportRaw(pngJ, jpg);
        if (exportWebp) {
            FLExternal.cwebp(pngJ, jpg);
        }
        this.exportImage(bitmap, jpg, JPG_QUALITY);
        lib.deleteItem(bitmap.name);
    }

    private exportPng(bitmap: FlashItem, exname: string) {
        this.exportImage(bitmap, exname);
        //保存原始图片，增加.raw后缀
        this.exportRaw(exname);
        if (exportWebp) {
            FLExternal.cwebp(exname);
        }
        FLExternal.pngquant(exname);
        lib.deleteItem(bitmap.name);
    }

    private exportImage(bitmap: FlashItem, name: string, JpgQuality?: number) {
        if (!bitmap.exportToFile(name)) {
            return Log.throwError("导出", name, "失败");
        }
    }

    private exportRaw(input: string, output?: string) {
        //保存原始图片，增加.raw后缀
        if (exportRaw || flaname == "lib") {//lib保存原始文件
            let raw = (output || input) + Extension.Raw;
            if (FLfile.exists(raw)) {
                FLfile.remove(raw);
            }
            FLfile.copy(input, raw);
        }
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
    private doPacking(inputs: ImageInfo[], key: string, packer: IBlockPacker, results: Result[], param?: number) {
        let len = inputs.length;
        let blocks = <ImageInfo[]>packer.fit(inputs);
        if (!blocks) {
            return;
        }
        if (len != blocks.length) {
            Log.trace("装箱时，有Block没被装箱，请检查！", len, blocks.length);
            return;
        }
        let reBlocks: ImageInfo[] = param == undefined && [];
        let noFit = false;
        let width = 0;
        let height = 0;
        for (let n = 0; n < len; n++) {
            let block = blocks[n];
            let fit = block.fit;
            if (fit) {
                let right = fit.x + block.w;
                if (right > width) {
                    width = right;
                }
                let bottom = fit.y + block.h;
                if (bottom > Const.MaxSize) {// 由于IBlockParser有设置width的参数，所以不做宽度超标判断，只做高度超标判断，宽度超标在设置宽度时候判断
                    Log.trace("尺寸超标", bottom);
                    noFit = true;
                    break;
                }
                if (bottom > height) {
                    height = bottom;
                }
                if (reBlocks) {
                    reBlocks.push(block.clone());
                }
            } else {
                noFit = true;
                break;
            }
        }
        if (noFit) {
            Log.log(key + "noFit");
        } else {
            let result: Result = {
                key,
                blocks: reBlocks,
                width,
                height,
                fit: width * height,
                param
            };
            results.push(result);
            // Log.trace(result.key + ":" + result.fit);
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
    width: number;
    height: number;

    /**
     * 
     * 参数
     * @type {number}
     * @memberOf Result
    
     */
    param?: number
};

interface ImageIndexInfo {
    name: string;
    // /**
    //  * 在suidata中的索引
    //  * （只导出一张png时用，和lib没有关系）
    //  */
    // index: number;

    /**
    * 在suidata中的索引
    * （拆分为png时用，和lib没有关系）
    */
    pngindex: number;
    /**
     * 在suidata中的索引
     * （拆分为jpg时用，和lib没有关系）
     */
    jpgindex: number;
}