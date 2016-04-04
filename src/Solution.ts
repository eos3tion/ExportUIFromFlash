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
    public compCheckers: {[index: number]: ComWillCheck};

    /**
     * 面板检查器的字典
     */
    public panelCheckers: {[index: number]: ComWillCheck};

    public imgParser: ImageParser;

    /**
     * 代码生成器
     */
    public generator: IPanelGenerator;

    constructor() {
        this.compCheckers = {};
        this.panelCheckers = {};
        this.imgParser = new ImageParser;
        this.inlineCheckers();
    }

    private inlineCheckers() {
        // 面板处理器，使用Solution中的解决方案
        this.regPanelChecker(new ComWillCheck(ExportType.Container, /^ui[.].*?[.].*?(Panel|Dele)$/, this.getPanelData));
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


    private doCheck(item: FlashItem, checkers: {[index: number]: ComWillCheck}) {
        for (let ckey in checkers) {
            let checker = checkers[ckey];
            if (checker.check(item)) {
                checker.add(item);
                break;
            }
        }
    }

    /**
     * 预检测，进行预检测
     */
    private preCheck() {
        let items = lib.items;
        let blocks: ImageInfo[] = [];
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.itemType === "movie clip") { // 只处理MC
                // 只处理要导出的Item ，也处理导入，导入特殊处理
                if (item.linkageClassName) {
                    // 检查输入元素，以供后续使用
                    this.doCheck(item, this.compCheckers);
                    // 检查面板
                    this.doCheck(item, this.panelCheckers);
                    // 检查图片
                    this.imgParser.checkItem(item, blocks);
                }
            }
        }
        return blocks;
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
    private getSolveData(checkers: {[index: number]: ComWillCheck}): {[index: number]: any[]} {
        let data: {[index: number]: any[]} = {};
        // 处理面板数据
        for (let ckey in checkers) {
            let checker = checkers[ckey];
            if (checker.idx) {
                let list = [];
                // 0 类名字的数组
                // 1 对应索引的数据
                data[ckey] = [checker.classNames, list];
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
        let ename: string|number = 0;
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
        data[5] = +ele.getTextAttr("letterSpacing");
        data[6] = +ele.getTextAttr("bold");
        data[7] = +ele.getTextAttr("italic");
        // 文本框只允许加一个滤镜，并且只处理GlowFilter，视为描边
        data[8] = 0;
        let filters = ele.filters;
        if (filters) {
            for (let filter of filters) {
                if (filter.name !== "glowFilter"){
                    alert("文本框只允许加一个滤镜，并且只处理GlowFilter，视为描边，当前加的滤镜为：" + filter.name + "，将被忽略");
                }else {
                    // blurX 作为描边宽度
                    data[8] = [ filter.color , filter.blurX ];
                    break;
                }
            }
        }
        return data;
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
        let type = ele.elementType;
        let data = [];
        // 处理基础数据
        data[1] = this.getEleBaseData(ele);
        switch (type) {
            case "text": // 文本框特殊数据
                data[0] = ExportType.Text;
                data[2] = this.getTextData(<FlashText>ele);
                break;
            case "instance": // 处理实例数据
                let itype = ele.instanceType;
                let item = ele.libraryItem;
                let lname = item.name;
                switch (itype) {
                    case "bitmap":
                        // 位图数据
                        data[0] = ExportType.Image;
                        // 位图使用库中索引号，并且图片不允许使用其他库的
                        data[2] = this.imgParser.bitmaps[lname].idx;
                        break;
                    case "symbol":
                        data[3] = 0; // 默认为当前swf
                        // 引用数据
                        if (item.linkageImportForRS) { // 共享导入
                            let iurl = item.linkageURL;
                            if (iurl) { // 不像flash项目，使用lib.swf，只填写导入名称
                                if (iurl === "lib") {
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
                            // 无导出名的，直接当做子控件处理
                            data[0] = ExportType.Container;
                            data[2] = this.getPanelData(null, item);
                        }
                        break;
                    default:
                        Log.throwError(errPrefix + "->" + ele.name + "为不支持的实例类型(instanceType)：" + type);
                        break;
                }

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
        let timeline = item.timeline;
        let layers = timeline.layers;
        let name = item.name;
        let depthEles:DepthEleData[] = [];
        let pi = 0;
        lib.editItem(name); // 坑爹的，不进入编辑模式，无法取得depth
        // 从最底层往上遍历
        for (let i = layers.length - 1; i >= 0; i--, pi++) {
            let layer = layers[i];
            if (layer.layerType !== "normal") { // 只允许使用普通层
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
                // fl.trace(JSON.stringify(ele));
                depthEles.push(new DepthEleData(pi, ele.depth, this.getElementData(ele, name + "->" + "第" + i + "层")));
            }
        }
        dom.exitEditMode();
        depthEles.sort(function (a, b) {
            return a.idx - b.idx;
        }); // 从小到大排列，最终可以顺序addChild

        // 生成面板代码
        depthEles.forEach(function (item, idx) {
            // fl.trace("lllll:"+item.name+"|"+item.idx);
            depthEles[idx] = item.data;
        });
        if (list) {
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
    private generatePanels( panelsData: {[index: number]: any[]}) {
        let generator = this.generator;
        if (!generator) {
            alert("未配置代码生成器，将不生成代码");
            return;
        }
        for (let type in panelsData) {
            let pData = panelsData[type];
            let panelsName = pData[0];
            let panelsInfo = pData[1];

            let len = panelsName.length;
            for (let i = 0; i < len; i++) {
                let name: string = panelsName[i];
                let pInfo: any[] = panelsInfo[i];
                generator.generateOnePanel(name, pInfo);
            }
        }
    }


    /**
     * 尝试运行
     */
    public run() {
        let blocks = this.preCheck();
        let imgData = this.solveImage(blocks);
        // 获取元件的数据
        let componentsData = this.getSolveData(this.compCheckers);
        // 导出的数据
        let exportData = [imgData, componentsData];

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