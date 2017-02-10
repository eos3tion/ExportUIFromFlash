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
        arr[0] = pngblocks;
        arr[1] = jpgblocks;
        arr[2] = blocks;
        let ispng: boolean = true;
        /**
         * 不拆分，直接做成一张png
         */
        let iscompose: boolean = false;
        let self = this;
        for (let j = 0; j < 3; j++) {
            blocks = arr[j];
            if (!blocks.length) {
                continue;
            }
            len = blocks.length;
            results = [];
            if (j == 1) {
                ispng = false;
            } else {
                ispng = true;
            }
            if (j == 2) {
                iscompose = true;
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
                total = Math.min(Const.MaxSize, total);
                //从最宽的一个 到总宽度的 进行遍历设置
                for (let w = maxWidth; w <= total; w++) {
                    packer.setWidth(w);
                    Log.trace("正在使用宽度：", w);
                    let keyPre = "setWidth:" + w;
                    if (packer.selfSorting) {
                        this.doPacking(blocks, keyPre, packer, results, w);
                    } else {
                        packingForSort(blocks, packer, results, keyPre);
                    }
                }
            } else {
                if (packer.selfSorting) {
                    this.doPacking(blocks, "", packer, results);
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
                minBlocks = packer.fit(blocks) as ImageInfo[];
            }
            this.exportImage(minBlocks, ispng, iscompose);
        }
        let bool = this.checkFileSize();
        let pngurl = folder + PNG_FILE;
        let jpgurl = folder + JPG_FILE;
        let composeurl = folder + "compose" + PNG_FILE;
        const imgDatas = this.imgDatas;
        if (bool) {
            //分开的更小,删除组合的
            FLfile.remove(composeurl);
            delete imgDatas.compose;
        } else {

            //删除多余的png jpg 保留组合的图片
            FLfile.remove(pngurl);
            FLfile.remove(jpgurl);
            FLfile.copy(composeurl, pngurl);
            FLfile.remove(composeurl);
            // return this.tempComposeImgDatas;
            imgDatas.png = imgDatas.compose;
            delete imgDatas.compose;
            delete imgDatas.jpg;
        }

        let raw = this.rawBlocks;
        let copy = this.tempIndexDic;
        for (let key in copy) {
            let c = copy[key];
            const {name, index, jpgindex, pngindex} = c;
            for (let r of raw) {
                if (r.getName() == name) {
                    r.setIndexInfo(c);
                }
            }
        }
        return imgDatas;
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

            // 再来100次乱序
            for (let t = 0; t < 100; t++) {
                blocks.sort(sort.random);
                self.doPacking(blocks, keyPre + "random" + t, packer, results);
            }
        }
    }
    /**
     * 将快信息导出成图片
     * @param iscompose 是否不拆分直接导出成一张png
     */
    private exportImage(result: ImageInfo[], ispng: boolean, iscompose: boolean) {
        let bitmaps = this.bitmaps;

        // let imgDatas;
        // if (iscompose) {
        //     imgDatas = this.tempComposeImgDatas;
        // } else {
        //     imgDatas = this.imgDatas;
        // }
        let tname = "$$$temp";
        if (lib.itemExists(tname)) {
            lib.deleteItem(tname);
        }
        // 创建一个新的原件
        lib.addNewItem("movie clip", tname);
        lib.editItem(tname);

        // 将info中数据放入这个
        let pngcount = 0;
        let jpgcount = 0;
        let pngs: number[][] = [];
        let jpgs: number[][] = [];
        for (let k = 0, len = result.length; k < len; k++) {
            let block = result[k];
            let kname = block.getName();
            let tmp = this.tempIndexDic[kname];
            if (!tmp) {
                tmp = <ImageIndexInfo>{};
                tmp.name = kname;
            }
            if (iscompose) {
                tmp.index = k;
                pngs[k] = block.toExport();
            } else {
                if (block.getIsPng()) {
                    tmp.pngindex = pngcount;
                    pngs[pngcount] = block.toExport();
                    pngcount++;
                } else {
                    tmp.jpgindex = jpgcount;
                    jpgs[jpgcount] = block.toExport();
                    jpgcount++;
                }
            }
            let item = block.getLibItem();
            item.allowSmoothing = false;
            item.compressionType = "lossless";

            this.tempIndexDic[kname] = tmp;

            bitmaps[kname] = block;
            block.setIdx(k);
            let fit = block.fit;
            if (fit) {
                let hw = block.w * 0.5;
                let hh = block.h * 0.5;
                let pos = {
                    x: fit.x + hw,
                    y: fit.y + hh
                };
                while (!lib.addItemToDocument(pos, kname));
                dom.mouseClick(pos, false, true);
                dom.setElementProperty("x", fit.x);
                dom.setElementProperty("y", fit.y);
            } else {
                Log.trace("noFit", JSON.stringify(block));
            }
        }

        /********将图片拼合，并导出********/
        dom.selectAll();
        while (!dom.convertSelectionToBitmap());
        let ele = dom.selection[0];
        if (!ele) {
            Log.throwError("没有成功拼合图片");
        }
        let bitmap = ele.libraryItem;
        bitmap.allowSmoothing = false;
        bitmap.compressionType = "lossless";

        // 导出的文件路径
        let exname = folder + PNG_FILE;
        if (iscompose) {
            exname = folder + "compose" + PNG_FILE;
        }
        if (!ispng) {
            exname = folder + JPG_FILE;
        }
        if (ispng) {
            while (!bitmap.exportToFile(exname));
        } else {
            while (!bitmap.exportToFile(exname, JPG_QUALITY));
        }
        const imgDatas = this.imgDatas;
        if (iscompose) {
            imgDatas.compose = pngs;
        } else {
            if (pngs.length) {
                imgDatas.png = pngs;
            }
            if (jpgs.length) {
                imgDatas.jpg = jpgs;
            }
        }

        // 删除临时文件
        // 图片导出之前，删除操作会失败，所以加了while
        while (!lib.deleteItem(bitmap.name));
        while (!lib.deleteItem(tname));
        if (ispng) {
            FLExternal.pngquant(exname);
        }

        // 导出图片数据
        // return imgDatas;
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
        //alert(len);
        let blocks = <ImageInfo[]>packer.fit(inputs);
        if (!blocks) {
            return;
        }
        if (len != blocks.length) {
            Log.trace("装箱时，有Block没被装箱，请检查！", len, blocks.length);
            return;
        }
        Log.trace("开始添加结果集");

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
            Log.trace(key + "noFit");
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
            Log.trace(result.key + ":" + result.fit);
        }
    }

    /** 比较拆分出来的图片和整张png的大小
     *  拆分的较小则返回true
    */
    private checkFileSize() {
        let pngfile = folder + PNG_FILE;
        let jpgfile = folder + JPG_FILE;
        let compose = folder + "compose" + PNG_FILE;
        let pngsize = FLfile.getSize(pngfile);
        let jpgsize = FLfile.getSize(jpgfile);
        let composesize = FLfile.getSize(compose);
        let total = jpgsize + pngsize + 100;//100差不多为多一次http请求的字节数
        Log.trace("组合图片的大小：", composesize, "拆分后，jpg大小：", jpgsize, "png大小：", pngsize);
        return total < composesize;
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
    /**
     * 在suidata中的索引
     * （只导出一张png时用，和lib没有关系）
     */
    index: number;

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