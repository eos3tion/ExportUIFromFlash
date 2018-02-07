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

    /**
     * 引用的面板名字索引
     * 
     * @type {string[]}
     */
    public panelNames: string[] = [];

    public addToPanelNames(name: string) {
        let panelNames = this.panelNames;
        let idx = panelNames.indexOf(name);
        if (!~idx) {
            idx = panelNames.length;
            panelNames[idx] = name;
        }
        return idx;
    }

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
            iii.setName(bname);
            iii.setLibItem(bItem);
            // 无法直接FlashItem大小，先将Item加入到舞台，选中获取大小，所以图片的宽度和高度通过element获取像素宽度和高度
            iii.w = ele.hPixels; // 得到图片宽度
            iii.h = ele.vPixels; // 得到图片高度
            bitmaps[bname] = iii;
            BitmapAlphaCheck.checkAlpha(ele, iii);
            this.blocks.push(iii);
        }
        iii.addRef(libItem);
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
            let testKey = checker.check(item, this);
            if (testKey != undefined) {
                let tester = checkers[testKey];
                if (tester) {
                    tester.add(item, this.getItemSize(item));
                    break;
                }
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
        let gap = typeof ImageGap == "number" ? ImageGap : 1;
        if (gap < 0) {
            gap = 1;
        }
        packer.gap = gap;
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
                checker.forEach(this, list);
            }
        }
        return data;
    }

    /**
   * 获取一个元素的基础数据
   * 
   * @private
   * @param {FlashElement} ele 元素
   * @returns {BaseData} 导出的数据
   *  0 元素名字，如果没有名字，用0
      1 x坐标
      2 y坐标
      3 宽度
      4 高度
      5 旋转角度/或者matrix的[a,b,c,d]四个值组成的数组
   */
    public getEleBaseData(ele: FlashElement): BaseData {
        let ename: string | 0 = 0;
        if (ele.name) {
            ename = ele.name;
        }
        let matrix = ele.matrix;
        let result = ele.rotation as any;//用于兼容之前的数据
        if (matrix.a != 1 || matrix.b != 0 || matrix.c != 0 || matrix.d != 1) {
            //有进行过变形
            result = [matrix.a, matrix.b, matrix.c, matrix.d];
        }
        // 处理基础数据
        let data = [ename, Math.round(ele.x), Math.round(ele.y), ele.width, ele.height, result] as BaseData
        let colorAlphaPercent = ele.colorAlphaPercent;
        if (colorAlphaPercent != undefined && colorAlphaPercent != 100) {
            data[6] = colorAlphaPercent / 100;
        }
        return data;
    }

    /**
     * 获取文本数据
     */
    public getTextData(ele: FlashText) {
        if (ele.textType === "static") {
            Log.throwError("不允许使用静态文本框");
        }

        let data = [];

        data[0] = ["static", "dynamic", "input"].indexOf(ele.textType);
        let face = ele.getTextAttr("face");
        data[1] = face == DefaultFonts ? 0 : face;
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
        const { layer, error } = this.getScaleBitmapLayer(layers, item);
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
        if (!ele) {
            Log.throwError("此控件没有位图", item.name);
        }
        else if (ele.elementType === ElementType.Instance && ele.instanceType === InstanceType.Bitmap) {
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
        // if (this.iscompose) {
        let iii = this.imgParser.bitmaps[item.name];
        Log.trace(item.name, this.iscompose, iii.getIdx(), iii.getIndex());
        return iii ? (this.iscompose ? iii.getIdx() : iii.getIndex()) : -1;
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
        let data = [] as ComponentData;
        // 处理基础数据
        let baseData = data[1] = this.getEleBaseData(ele);
        let compCheckers = this.compCheckers;
        out: switch (type) {
            case ElementType.Text: // 文本框特殊数据
                data[0] = ExportType.Text;
                data[2] = this.getTextData(<FlashText>ele);
                baseData[5] = 0;//不需要matrix信息
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
                        data[2] = index;
                        break;
                    case InstanceType.Symbol:
                        {
                            let linkageClassName = item.linkageClassName;
                            switch (linkageClassName) {
                                case "ui.Rectangle": {//用于定位坐标
                                    data[0] = ExportType.Rectangle;
                                    if (baseData[0] == 0) {//没有名字，自动生成名字
                                        baseData[0] = "Rect" + (this.guid++);
                                    }
                                    baseData[5] = 0;//不需要matrix信息
                                    break out;
                                }
                                case "ui.Sprite": {//用于定位的空容器
                                    data[0] = ExportType.Sprite;
                                    if (baseData[0] == 0) {//没有名字，自动生成名字
                                        baseData[0] = "Con" + (this.guid++);
                                    }
                                    baseData[5] = 0;//不需要matrix信息
                                    break out;
                                }
                                case "ui.ImageLoader": {
                                    data[0] = ExportType.ImageLoader;
                                    if (baseData[0] == 0) {
                                        baseData[0] = "Img" + (this.guid++);
                                    }
                                    baseData[5] = 0;//不需要matrix信息
                                    break out;
                                }
                            }
                            // data[3] = 0; // 0 可不进行设置， 默认为当前swf

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
                            if (linkageClassName) { // 有导出名，说明是控件或其他
                                // 得到控件索引
                                if (item.$key in compCheckers) {
                                    data[0] = compCheckers[item.$key].key;
                                    // 记录控件的索引
                                    data[2] = item.$idx;
                                } else {
                                    data[0] = ExportType.ExportedContainer;
                                    // 记录控件的索引

                                    data[2] = this.addToPanelNames(linkageClassName);
                                    //Log.throwError(errPrefix + "->" + ele.name + "有导出名，但不是控件:" + lname);
                                }
                            } else {
                                let other = true;
                                if (ele.symbolType == SymbolType.Button) {//没有导出名，并且是按钮，直接走MCButton
                                    data[0] = ExportType.MCButton;
                                    let checker = compCheckers[ExportType.MCButton];
                                    data[2] = checker.parseHandler(item, this);
                                    other = false;
                                } else if (item.$scale9Layer) {
                                    data[0] = ExportType.ScaleBmp;
                                    data[2] = this.getScaleBitmapData(item);
                                    other = false;
                                } else {
                                    // 对非共享导入，并且没有导出名的控件进行优化
                                    // 看看是否直接使用的位图
                                    // 必须为单层，单帧，并且里面只有一个位图对象
                                    let timeline = item.timeline;
                                    let layers = timeline.layers;
                                    let llen = layers.length;
                                    if (llen == 1) {
                                        let layer = layers[0];
                                        if (layer.layerType != LayerType.Guide) {//不能为引导层
                                            let frames = layer.frames;
                                            let flen = frames.length;
                                            if (flen == 1) {
                                                let eles = frames[0].elements;
                                                if (eles.length == 1) {//只有一个元素的时候，做此处理
                                                    let subEle = eles[0];
                                                    if (subEle && subEle.elementType === "instance" && subEle.instanceType === "bitmap") {
                                                        // 进行优化
                                                        // 如果有scale9信息，作为scale9的位图处理
                                                        let subItem = subEle.libraryItem;
                                                        data[0] = ExportType.Image;
                                                        // 位图使用库中索引号，并且图片不允许使用其他库的
                                                        let index = this.getBitmapIndex(subItem);
                                                        data[2] = index;
                                                        other = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if (other) {
                                    // 无导出名的，直接当做子控件处理
                                    let result = this.getPanelData(item, true);
                                    if (result == -1) {
                                        data[0] = ExportType.MovieClip;
                                        let checker = compCheckers[ExportType.MovieClip];
                                        data[2] = checker.parseHandler(item, this);
                                    } else {
                                        data[0] = ExportType.Container;
                                        data[2] = result;
                                    }
                                    // Log.trace(item.name, JSON.stringify(data[2]));
                                }
                            }
                            if (data[0] == ExportType.ScaleBmp) {
                                baseData[5] = ele.rotation;//不需要matrix信息
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
    private getPanelData(item: FlashItem, flag?: boolean) {
        if (item.linkageImportForRS) {
            return 0;//用于占位，如果中间有面板是导入的，会占用面板名字，但是这种面板不会又数据，会导致后续索引错位
        }
        let timeline = item.timeline;
        let layers = timeline.layers;
        let name = item.name;
        let depthEles: DepthEleData[] = [];
        lib.editItem(name); // 坑爹的，不进入编辑模式，无法取得depth
        // 从最底层往上遍历
        for (let i = layers.length - 1, pi = 0; i >= 0; i-- , pi++) {
            let layer = layers[i];
            if (layer.layerType !== LayerType.Normal) { // 只允许使用普通层
                continue;
            }
            let frames = layer.frames;
            let flen = frames.length;

            if (flen > 1) {
                !flag && Log.throwError(name, "作为面板，帧数大于1");
                //作为mc处理
                return -1;
            }
            if (!flen) { // 空层
                continue;
            }

            let frame = frames[0];
            let elements = frame.elements;
            let elen = elements.length;
            for (let ei = 0; ei < elen; ei++) {
                let ele = elements[ei];
                let dat = this.getElementData(ele, `${name}->第${i}层，${ele.name}`);
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
        this.addToPanelNames(item.linkageClassName);
        // Log.trace("getPanelData:", name, JSON.stringify(depthEles));
        return depthEles;
    }
    /**
     * 输出面板
     * 
     * @private
     * @param {{[index: number]: any[]}} panelsData
     */
    private generatePanels(panelsData: [number, SizeData, ComponentData][]) {
        let generator = this.generator;
        if (!generator) {
            alert("未配置代码生成器，将不生成代码");
            return;
        }
        let panelNames = this.panelNames;
        for (let pData of panelsData) {
            let idx = pData[0];
            let panelsName = panelNames[idx];
            let pInfo = pData[2];
            let sizeInfo = pData[1];
            if (pInfo) {//没有pInfo的是从外部导入的面板
                generator.generateOnePanel(panelsName, pInfo, sizeInfo);
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
        let pngs: number[][], jpgs: number[][];
        if (imgData) {
            pngs = imgData.png;
            jpgs = imgData.jpg;
        }

        this.iscompose = !pngs || !jpgs;
        // 获取元件的数据
        let componentsData = this.getSolveData(this.compCheckers);

        // 导出的数据
        let exportData = [];
        exportData[0] = pngs ? pngs : 0; //0 为了防止全部用jpg导出，0比null活着undefined节省字符串
        exportData[1] = componentsData; //一定有组件数据
        if (jpgs) {
            exportData[2] = jpgs;
        }


        // 获取面板数据
        let panelsData = this.getSolveData(this.panelCheckers);
        let exPanelData = [];
        let panelNames = this.panelNames;
        for (let type in panelsData) {
            let pData = panelsData[type];
            let panelsName = pData[0];
            let panelsInfo = pData[1];
            let panelsSize = pData[2];
            let len = panelsName.length;
            // Log.trace("panelsData", panelsName, JSON.stringify(panelsInfo));
            for (let i = 0; i < len; i++) {
                let name: string = panelsName[i];
                let pInfo: any[] = panelsInfo[i];
                let sizeInfo: number[] = panelsSize[i];
                // Log.trace("exPanelData", name, JSON.stringify(pInfo), JSON.stringify(sizeInfo));
                exPanelData.push([panelNames.indexOf(name), sizeInfo, pInfo]);
            }
        }

        // 处理面板
        this.generatePanels(exPanelData);

        if (ExportPanelData) {
            if (!exportData[2]) {
                exportData[2] = 0;
            }
            exportData[3] = exPanelData;
            exportData[4] = panelNames;
        }

        FLfile.write(folder + DATA_FILE, JSON.stringify(exportData));


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