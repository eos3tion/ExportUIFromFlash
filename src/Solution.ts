/**
 * 用于处理导出整个流程的解决方案
 * 1 预检测，将库中有导出名，并符合规则的控件或者面板找出，找到引用的图片
 * 2 处理图片
 * 3 处理控件
 * 4 自动生成面板代码
 * @author 3tion
 */
class Solution {

    /**
     * 控件检查器的字典
     */
    public compCheckers: { [index: number]: ComWillCheck };

    /**
     * 面板检查器的字典
     */
    public panelCheckers: { [index: number]: ComWillCheck };

    public imgParser: ImageParser;

    /**
     * 代码生成器
     */
    public generator: IPanelGenerator;

    private guid: number = 0;

    /**
     * 是否是组合的一张图片
     */
    private iscompose: boolean;

    /**
     * 装箱用的图片数据
     * 
     * @private
     * @type {ImageInfo[]}
     * @memberOf Solution
     */
    private blocks: ImageInfo[] = [];

    /**
     * 添加位图到bitmaps中
     * 
     * @param {FlashElement} ele
     * @param {FlashItem} libItem
     * 
     * @memberOf Solution
     */
    public addImageToLib(ele: FlashElement, libItem: FlashItem) {
        let bItem = ele.libraryItem;
        let bname = bItem.name;
        let bitmaps = this.imgParser.bitmaps;
        let iii = bitmaps[bname];
        if (!iii) {
            iii = new ImageInfo();
            iii.name = bname;
            iii.libItem = bItem;
            // 无法直接FlashItem大小，先将Item加入到舞台，选中获取大小，所以图片的宽度和高度通过element获取像素宽度和高度
            iii.w = ele.hPixels; // 得到图片宽度
            iii.h = ele.vPixels; // 得到图片高度
            bitmaps[bname] = iii;
            BitmapAlphaCheck.checkAlpha(ele, iii);
            this.blocks.push(iii);
        }
        let aaa = iii.refs;
        if (!~aaa.indexOf(libItem)) {
            aaa.push(libItem);
        }
    }

    constructor() {
        this.compCheckers = {};
        this.panelCheckers = {};
        this.imgParser = new ImageParser;
        this.inlineCheckers();
    }

    private inlineCheckers() {
        // 面板处理器，使用Solution中的解决方案
        this.regPanelChecker(new ComWillCheck(ExportType.Container, /^ui[.].*?[.].*?(Panel|Dele|Render|View)$/, this.getPanelData.bind(this)));
    }

    /**
     * 注册控件检查器
     * @param {ComWillCheck} checker (description)
     */
    public regComChecker(checker: ComWillCheck) {
        this.compCheckers[checker.key] = checker;
    }

    /**
     * 注册控件检查器
     * @param {ComWillCheck} checker (description)
     */
    public regPanelChecker(checker: ComWillCheck) {
        this.panelCheckers[checker.key] = checker;
    }


    private doCheck(item: FlashItem, checkers: { [index: number]: ComWillCheck }) {
        for (let ckey in checkers) {
            let checker = checkers[ckey];
            if (checker.check(item, this)) {
                checker.add(item, this.getItemSize(item));
                break;
            }
        }
    }

    /**
     * 预检测，进行预检测
     */
    private preCheck(blocks: ImageInfo[]) {
        let items = lib.items;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.itemType === ItemType.MovieClip) { // 只处理MC
                // 只处理要导出的Item ，也处理导入，导入特殊处理
                if (item.linkageClassName) {
                    // 检查输入元素，以供后续使用
                    this.doCheck(item, this.compCheckers);
                    // 检查面板
                    this.doCheck(item, this.panelCheckers);
                    // 检查图片
                    this.imgParser.checkItem(item, blocks, this);
                }
            }
        }
    }

    /**
     * 处理图片
     * 
     * @private
     * @param {ImageInfo[]} blocks
     */
    private solveImage(blocks: ImageInfo[]) {
        let packer = new GrowingPacker();
        return this.imgParser.parse(packer, blocks);
    }


    /**
     * 处理控件数据
     * @private
     */
    private getSolveData(checkers: { [index: number]: ComWillCheck }): { [index: number]: any[] } {
        let data: { [index: number]: any[] } = {};
        // 处理面板数据
        for (let ckey in checkers) {
            let checker = checkers[ckey];
            if (checker.idx) {
                let list = [];
                // 0 类名字的数组
                // 1 对应索引的数据
                data[ckey] = [checker.classNames, list, checker.sizes];
                checker.forEach(checker.parseHandler, this, list);
            }
        }
        return data;
    }

    /**
     * 获取一个元素的基础数据
     * 
     * @private
     * @param {FlashElement} ele 元素
     * @returns {any[]} 导出的数据
     *  0 元素名字，如果没有名字，用0
        1 x坐标
        2 y坐标
        3 宽度
        4 高度
        5 旋转角度
     */
    private getEleBaseData(ele: FlashElement): any[] {
        let ename: string | number = 0;
        if (ele.name) {
            ename = ele.name;
        }
        // 处理基础数据
        return [ename, ele.x, ele.y, ele.width, ele.height, ele.rotation];
    }

    /**
     * 获取文本数据
     */
    private getTextData(ele: FlashText) {
        if (ele.textType === "static") {
            Log.throwError("不允许使用静态文本框");
        }

        let data = [];

        data[0] = ["static", "dynamic", "input"].indexOf(ele.textType);
        data[1] = ele.getTextAttr("face");
        data[2] = ["left", "center", "right", "justify"].indexOf(ele.getTextAttr("alignment"));
        data[3] = ele.getTextAttr("fillColor");
        data[4] = +ele.getTextAttr("size");
        data[5] = +ele.getTextAttr("lineSpacing");
        data[6] = +ele.getTextAttr("bold");
        data[7] = +ele.getTextAttr("italic");
        // 文本框只允许加一个滤镜，并且只处理GlowFilter，视为描边
        data[8] = 0;
        let filters = ele.filters;
        if (filters) {
            for (let filter of filters) {
                if (filter.name !== "glowFilter") {
                    alert("文本框只允许加一个滤镜，并且只处理GlowFilter，视为描边，当前加的滤镜为：" + filter.name + "，将被忽略");
                } else {
                    // blurX 作为描边宽度
                    data[8] = [filter.color, filter.blurX];
                    break;
                }
            }
        }
        return data;
    }

    public getScaleBitmapLayer(layers: FlashLayer[], item: FlashItem): { layer?: FlashLayer, error?: string } {
        if (item.$scale9Checked) {
            return { layer: item.$scale9Layer };
        }
        let llen = layers.length;
        let layer: FlashLayer;
        let error: string;
        if (llen == 2) {//使用 BitmapSlice9.jsfl处理之后的元件
            let flag = 0;
            for (let i = 0; i < llen; i++) {
                let tlayer = layers[i];
                let lname = tlayer.name;
                if (lname.substr(-4) == "_bmp") {
                    flag |= 0b1;
                    layer = tlayer;
                }
                if (lname.substr(-7) == "_slices") {
                    flag |= 0b10;
                }
            }
            if (flag != 0b11) {
                error = "九宫图片不符合使用BitmapSlice9.jsfl处理的图片规范";
            }
        }
        else if (llen == 1) {
            layer = layers[0];
        }
        item.$scale9Checked = true;
        item.$scale9Layer = layer;
        return { layer, error };
    }

    /**
     * 获取ScaleBitmap的数据
     * 
     * @param {FlashElement} ele
     * @param {FlashItem} item
     * 
     * @memberOf Solution
     */
    public getScaleBitmapData(item: FlashItem) {
        let data = [];
        let grid = item.scalingGrid;
        if (!grid) {
            Log.throwError("此控件没有设置九宫信息", item.name);
            return;
        }
        let rect = item.scalingGridRect;
        let timeline = item.timeline;
        let layers = timeline.layers;
        const {layer, error} = this.getScaleBitmapLayer(layers, item);
        if (!layer) {
            Log.throwError("九宫图片的图层不符合要求", item.name);
            return;
        }
        if (error) {
            Log.throwError(error, item.name);
            return;
        }
        let frames = layer.frames;
        if (frames.length > 1) {
            Log.throwError("九宫图片只能为1帧", item.name);
            return;
        }
        let elements = frames[0].elements;
        if (elements.length > 1) {
            Log.throwError("九宫元件引导层只能引用一张位图", item.name);
            return;
        }
        let ele = elements[0];
        if (ele.elementType === ElementType.Instance && ele.instanceType === InstanceType.Bitmap) {
            data[0] = this.getElementData(ele);
            var gx = Math.round(rect.left);
            var gy = Math.round(rect.top);
            var gr = Math.round(rect.right);
            var gb = Math.round(rect.bottom);
            data[1] = [gx, gy, gr - gx, gb - gy];
        }
        return data;
    }

    /**
     * 获取位图的索引
     * @param {FlashItem}  item 库中原件
     */
    public getBitmapIndex(item: FlashItem) {

        for (let block of this.blocks) {
            if (block.name == item.name) {
                if (block.ispng) {
                    return block.pngindex;
                } else {
                    return -1 - block.jpgindex;
                }
            }
        }
        // let iii = this.imgParser.bitmaps[item.name];
        return -1;
    }

    /**
     * 获取元素数据
     *
     * @param {FlashElement}    ele 元素
     * @param {string}          errPrefix 报错用的提示数据
     * @returns 元素的数据
     * 0 导出类型
     * 1 基础数据 @see Solution.getEleBaseData
     * 2 对象数据 不同类型，数据不同
     * 3 引用的库 0 当前库  1 lib  字符串 库名字
     */
    public getElementData(ele: FlashElement, errPrefix: string = "") {
        //alert("getElementData:" + ele.name);
        let type = ele.elementType;
        let data = [];
        // 处理基础数据
        data[1] = this.getEleBaseData(ele);
        switch (type) {
            case ElementType.Text: // 文本框特殊数据
                data[0] = ExportType.Text;
                data[2] = this.getTextData(<FlashText>ele);
                break;
            case ElementType.Instance: // 处理实例数据
                let itype = ele.instanceType;
                let item = ele.libraryItem;
                let lname = item.name;
                switch (itype) {
                    case InstanceType.Bitmap:
                        // 位图数据
                        data[0] = ExportType.Image;
                        // 位图使用库中索引号，并且图片不允许使用其他库的
                        let index = this.getBitmapIndex(item);
                        data[2] = index;//在组合成一张png导出的情况下，lib里的索引和block.index一致
                        // if (!this.iscompose) {
                        //     for (let block of this.blocks) {
                        //         if (block.name == item.name) {
                        //             if (block.ispng) {
                        //                 data[2] = block.pngindex;
                        //             } else {
                        //                 data[2] = -1 - block.jpgindex;
                        //             }
                        //             break;
                        //         }
                        //     }
                        // }
                        break;
                    case InstanceType.Symbol:
                        if (item.linkageClassName == "ui.Rectangle") {//用于定位坐标
                            data[0] = ExportType.Rectangle;
                            if (data[1][0] == 0) {//没有名字，自动生成名字
                                data[1][0] = "Rect" + (this.guid++);
                            }
                            break;
                        }
                        data[3] = 0; // 默认为当前swf
                        // 引用数据

                        if (item.linkageImportForRS) { // 共享导入
                            let iurl = item.linkageURL;
                            if (iurl) { // 不像flash项目，使用lib.swf，只填写导入名称
                                if (iurl === "lib") {
                                    //alert(item.name + ":" + iurl + " １");
                                    data[3] = 1;
                                } else {
                                    data[3] = iurl;
                                }
                            }
                        }
                        // 检查是否有导出名
                        if (item.linkageClassName) { // 有导出名，说明是控件或其他
                            // 得到控件索引
                            if (item.$key in this.compCheckers) {
                                data[0] = this.compCheckers[item.$key].key;
                                // 记录控件的索引
                                data[2] = item.$idx;
                            } else {
                                Log.throwError(errPrefix + "->" + ele.name + "有导出名，但不是控件:" + lname);
                            }
                        } else {
                            let other = true;
                            if (item.$scale9Layer) {
                                data[0] = ExportType.ScaleBmp;
                                data[2] = this.getScaleBitmapData(item);
                                other = false;
                            }
                            else {
                                // 对非共享导入，并且没有导出名的控件进行优化
                                // 看看是否直接使用的位图
                                // 必须为单层，单帧，并且里面只有一个位图对象
                                let timeline = item.timeline;
                                let layers = timeline.layers;
                                let llen = layers.length;
                                if (llen == 1) {
                                    let layer = layers[0];
                                    let frames = layer.frames;
                                    let flen = frames.length;
                                    if (flen == 1) {
                                        let subEle = frames[0].elements[0];
                                        if (subEle && subEle.elementType === "instance" && subEle.instanceType === "bitmap") {
                                            // 进行优化
                                            // 如果有scale9信息，作为scale9的位图处理
                                            let subItem = subEle.libraryItem;
                                            // if (item.scalingGrid) {
                                            //     data[0] = ExportType.ScaleBmp;
                                            //     data[2] = this.getScaleBitmapData(item);

                                            //     //fl.trace("dddddddaaaa:" + JSON.stringify(data));
                                            // } else {
                                            // 位图数据
                                            data[0] = ExportType.Image;
                                            // 位图使用库中索引号，并且图片不允许使用其他库的
                                            // data[2] = this.getBitmapIndex(subItem);


                                            // 位图使用库中索引号，并且图片不允许使用其他库的
                                            let index = this.getBitmapIndex(subItem);
                                            data[2] = index;//在组合成一张png导出的情况下，lib里的索引和block.index一致
                                            // if (!this.iscompose) {
                                            //     for (let block of this.blocks) {
                                            //         if (block.name == subItem.name) {
                                            //             if (block.ispng) {
                                            //                 data[2] = block.pngindex;
                                            //             } else {
                                            //                 data[2] = -1 - block.jpgindex;
                                            //             }
                                            //             break;
                                            //         }
                                            //     }
                                            // }


                                            // }
                                            other = false;
                                        }
                                    }
                                }
                            }
                            if (other) {
                                // 无导出名的，直接当做子控件处理
                                data[0] = ExportType.Container;
                                data[2] = this.getPanelData(null, item);
                            }
                        }
                        break;
                    default:
                        Log.throwError(errPrefix + "->" + ele.name + "为不支持的实例类型(instanceType)：" + itype);
                        break;
                }
                break;
            case ElementType.Shape:
                break;
            default:
                Log.throwError(errPrefix + "->" + ele.name + "为不支持的元素类型(elementType):" + type);
                break;
        }
        return data;
    }

    /**
	 * 获取面板Panel/Dele的数据<br/>
	 * 面板必须是单帧
	 */
    private getPanelData(checker: ComWillCheck, item: FlashItem, list?: any[]) {
        //alert("getPanelData " + item.name)
        if (item.linkageImportForRS) {
            return undefined;
        }
        let timeline = item.timeline;
        let layers = timeline.layers;
        let name = item.name;
        let depthEles: DepthEleData[] = [];
        let pi = 0;
        lib.editItem(name); // 坑爹的，不进入编辑模式，无法取得depth
        // 从最底层往上遍历
        for (let i = layers.length - 1; i >= 0; i-- , pi++) {
            let layer = layers[i];
            if (layer.layerType !== LayerType.Normal) { // 只允许使用普通层
                continue;
            }
            let frames = layer.frames;
            let flen = frames.length;

            if (flen > 1) {
                Log.throwError(name, "作为面板，帧数大于1");
            }
            if (!flen) { // 空层
                continue;
            }

            let frame = frames[0];
            let elements = frame.elements;
            let elen = elements.length;
            for (let ei = 0; ei < elen; ei++) {
                let ele = elements[ei];
                let dat = this.getElementData(ele, name + "->" + "第" + i + "层");
                fl.trace("**************************\n" + JSON.stringify(dat) + "**************************\n");
                depthEles.push(new DepthEleData(pi, ele.depth, dat));
            }
        }
        dom.exitEditMode();
        depthEles.sort(function (a, b) {
            return a.idx - b.idx;
        }); // 从小到大排列，最终可以顺序addChild

        // 生成面板代码
        depthEles.forEach(function (item, idx) {
            //fl.trace("lllll:"+item.data.toString()+"|"+item.idx);
            depthEles[idx] = item.data;
        });
        if (list) {
            // 在 0 号位增加FlashItem的宽度和高度数据，方便在未加载到底图时候渲染
            list.push(depthEles);
        }
        return depthEles;
    }
    /**
     * 输出面板
     * 
     * @private
     * @param {{[index: number]: any[]}} panelsData
     */
    private generatePanels(panelsData: { [index: number]: any[] }) {
        let generator = this.generator;
        if (!generator) {
            alert("未配置代码生成器，将不生成代码");
            return;
        }
        for (let type in panelsData) {
            let pData = panelsData[type];
            let panelsName = pData[0];
            let panelsInfo = pData[1];
            let panelsSize = pData[2];
            let len = panelsName.length;
            for (let i = 0; i < len; i++) {
                let name: string = panelsName[i];
                let pInfo: any[] = panelsInfo[i];
                let sizeInfo: number[] = panelsSize[i];
                generator.generateOnePanel(name, pInfo, sizeInfo);
            }
        }
    }

    /**
     * 获取元件大小，方便在未加载到图片之前，先用绘图指令渲染一个底
     * 
     * @private
     * @param {FlashItem} item 
     * @returns {number[]} [0] 宽度  [1] 高度
     */
    private getItemSize(item: FlashItem): number[] {
        if (item.linkageImportForRS) {
            return undefined;
        }
        // 无法直接得到Item大小，先将Item加入到舞台，选中获取大小
        // 测量物品大小
        lib.editItem(item.name);
        dom.selectAll();
        let rect = dom.getSelectionRect();
        let w = rect.right - rect.left;
        let h = rect.bottom - rect.top;
        // 将加入到舞台的临时元件删除
        dom.exitEditMode();
        return [rect.left, rect.top, w, h];
    }


    /**
     * 尝试运行
     */
    public run() {
        let blocks = this.blocks;
        blocks.length = 0;
        this.preCheck(blocks);
        let imgData = this.solveImage(blocks);
        let pngs = imgData["png"];
        let jpgs = imgData["jpg"];
        if (pngs && jpgs) {
            this.iscompose = false;
        } else {
            this.iscompose = true;
        }
        // 获取元件的数据
        let componentsData = this.getSolveData(this.compCheckers);

        // 导出的数据
        let exportData;
        if (pngs && jpgs) {
            exportData = [pngs, componentsData, jpgs];
        } else if (pngs) {
            exportData = [pngs, componentsData];
        } else if (jpgs) {
            exportData = [componentsData, jpgs];
        } else {
            exportData = [componentsData];
        }

        FLfile.write(folder + DATA_FILE, JSON.stringify(exportData));

        // 获取面板数据
        let panelsData = this.getSolveData(this.panelCheckers);

        // 处理面板
        this.generatePanels(panelsData);

    }
}

/**
 * 用于存储元素的深度数据
 */
class DepthEleData {
    public idx: number;
    public data: any;
    constructor(layerIdx: number, depth: number, data: any) {
        this.idx = layerIdx * 10000 + (1000 - depth);
        this.data = data;
    }

}