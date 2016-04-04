/**
 * 用于处理导出整个流程的解决方案
 * 1 预检测，将库中有导出名，并符合规则的控件或者面板找出，找到引用的图片
 * 2 处理图片
 * 3 处理控件
 * 4 自动生成面板代码
 * @author 3tion
 */
var Solution = (function () {
    function Solution() {
        this.compCheckers = {};
        this.panelCheckers = {};
        this.imgParser = new ImageParser;
        this.inlineCheckers();
    }
    Solution.prototype.inlineCheckers = function () {
        // 面板处理器，使用Solution中的解决方案
        this.regPanelChecker(new ComWillCheck(ExportType.Container, /^ui[.].*?[.].*?(Panel|Dele)$/, this.getPanelData));
    };
    /**
     * 注册控件检查器
     * @param {ComWillCheck} checker (description)
     */
    Solution.prototype.regComChecker = function (checker) {
        this.compCheckers[checker.key] = checker;
    };
    /**
     * 注册控件检查器
     * @param {ComWillCheck} checker (description)
     */
    Solution.prototype.regPanelChecker = function (checker) {
        this.panelCheckers[checker.key] = checker;
    };
    Solution.prototype.doCheck = function (item, checkers) {
        for (var ckey in checkers) {
            var checker = checkers[ckey];
            if (checker.check(item)) {
                checker.add(item);
                break;
            }
        }
    };
    /**
     * 预检测，进行预检测
     */
    Solution.prototype.preCheck = function () {
        var items = lib.items;
        var blocks = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.itemType === "movie clip") {
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
    };
    /**
     * 处理图片
     *
     * @private
     * @param {ImageInfo[]} blocks
     */
    Solution.prototype.solveImage = function (blocks) {
        var packer = new GrowingPacker();
        return this.imgParser.parse(packer, blocks);
    };
    /**
     * 处理控件数据
     * @private
     */
    Solution.prototype.getSolveData = function (checkers) {
        var data = {};
        // 处理面板数据
        for (var ckey in checkers) {
            var checker = checkers[ckey];
            if (checker.idx) {
                var list = [];
                // 0 类名字的数组
                // 1 对应索引的数据
                data[ckey] = [checker.classNames, list];
                checker.forEach(checker.parseHandler, this, list);
            }
        }
        return data;
    };
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
    Solution.prototype.getEleBaseData = function (ele) {
        var ename = 0;
        if (ele.name) {
            ename = ele.name;
        }
        // 处理基础数据
        return [ename, ele.x, ele.y, ele.width, ele.height, ele.rotation];
    };
    /**
     * 获取文本数据
     */
    Solution.prototype.getTextData = function (ele) {
        if (ele.textType === "static") {
            Log.throwError("不允许使用静态文本框");
        }
        var data = [];
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
        var filters = ele.filters;
        if (filters) {
            for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
                var filter = filters_1[_i];
                if (filter.name !== "glowFilter") {
                    alert("文本框只允许加一个滤镜，并且只处理GlowFilter，视为描边，当前加的滤镜为：" + filter.name + "，将被忽略");
                }
                else {
                    // blurX 作为描边宽度
                    data[8] = [filter.color, filter.blurX];
                    break;
                }
            }
        }
        return data;
    };
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
    Solution.prototype.getElementData = function (ele, errPrefix) {
        if (errPrefix === void 0) { errPrefix = ""; }
        var type = ele.elementType;
        var data = [];
        // 处理基础数据
        data[1] = this.getEleBaseData(ele);
        switch (type) {
            case "text":
                data[0] = ExportType.Text;
                data[2] = this.getTextData(ele);
                break;
            case "instance":
                var itype = ele.instanceType;
                var item = ele.libraryItem;
                var lname = item.name;
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
                        if (item.linkageImportForRS) {
                            var iurl = item.linkageURL;
                            if (iurl) {
                                if (iurl === "lib") {
                                    data[3] = 1;
                                }
                                else {
                                    data[3] = iurl;
                                }
                            }
                        }
                        // 检查是否有导出名
                        if (item.linkageClassName) {
                            // 得到控件索引
                            if (item.$key in this.compCheckers) {
                                data[0] = this.compCheckers[item.$key].key;
                                // 记录控件的索引
                                data[2] = item.$idx;
                            }
                            else {
                                Log.throwError(errPrefix + "->" + ele.name + "有导出名，但不是控件:" + lname);
                            }
                        }
                        else {
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
    };
    /**
     * 获取面板Panel/Dele的数据<br/>
     * 面板必须是单帧
     */
    Solution.prototype.getPanelData = function (checker, item, list) {
        var timeline = item.timeline;
        var layers = timeline.layers;
        var name = item.name;
        var depthEles = [];
        var pi = 0;
        lib.editItem(name); // 坑爹的，不进入编辑模式，无法取得depth
        // 从最底层往上遍历
        for (var i = layers.length - 1; i >= 0; i--, pi++) {
            var layer = layers[i];
            if (layer.layerType !== "normal") {
                continue;
            }
            var frames_1 = layer.frames;
            var flen = frames_1.length;
            if (flen > 1) {
                Log.throwError(name, "作为面板，帧数大于1");
            }
            if (!flen) {
                continue;
            }
            var frame = frames_1[0];
            var elements = frame.elements;
            var elen = elements.length;
            for (var ei = 0; ei < elen; ei++) {
                var ele = elements[ei];
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
    };
    /**
     * 输出面板
     *
     * @private
     * @param {{[index: number]: any[]}} panelsData
     */
    Solution.prototype.generatePanels = function (panelsData) {
        var generator = this.generator;
        if (!generator) {
            alert("未配置代码生成器，将不生成代码");
            return;
        }
        for (var type in panelsData) {
            var pData = panelsData[type];
            var panelsName = pData[0];
            var panelsInfo = pData[1];
            var len = panelsName.length;
            for (var i = 0; i < len; i++) {
                var name_1 = panelsName[i];
                var pInfo = panelsInfo[i];
                generator.generateOnePanel(name_1, pInfo);
            }
        }
    };
    /**
     * 尝试运行
     */
    Solution.prototype.run = function () {
        var blocks = this.preCheck();
        var imgData = this.solveImage(blocks);
        // 获取元件的数据
        var componentsData = this.getSolveData(this.compCheckers);
        // 导出的数据
        var exportData = [imgData, componentsData];
        FLfile.write(folder + DATA_FILE, JSON.stringify(exportData));
        // 获取面板数据
        var panelsData = this.getSolveData(this.panelCheckers);
        // 处理面板
        this.generatePanels(panelsData);
    };
    return Solution;
}());
/**
 * 用于存储元素的深度数据
 */
var DepthEleData = (function () {
    function DepthEleData(layerIdx, depth, data) {
        this.idx = layerIdx * 10000 + (1000 - depth);
        this.data = data;
    }
    return DepthEleData;
}());
