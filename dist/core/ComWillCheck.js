/**
 * 带检测的控件的数据
 * @author 3tion
 */
var ComWillCheck = (function () {
    /**
     * Creates an instance of ComWillCheck.
     *
     * @param {number} key 类型标识
     * @param {RegExp} reg 用于识别控件类型的正则表达式
     * @param {ComWillCheckParser} parseHandler 处理函数
     * @param {string} [componentName] 导出时的控件名称(控件有此值，面板没有)
     */
    function ComWillCheck(key, reg, parseHandler, componentName) {
        this.key = key;
        this.reg = reg;
        this.parseHandler = parseHandler;
        this.dict = {};
        this.classNames = [];
        this.idx = 0;
        this.componentName = componentName;
    }
    /**
     * 检查库中的Item是否可以放入当前控件
     *
     * @param {FlashItem} item 待检查的Item
     */
    ComWillCheck.prototype.check = function (item) {
        var reg = this.reg;
        reg.lastIndex = 0;
        return reg.test(item.linkageClassName);
    };
    /**
     * 将Item放入库中存储
     *
     * @param {FlashItem} item
     */
    ComWillCheck.prototype.add = function (item) {
        this.dict[item.name] = item;
        var idx = this.idx++;
        item.$idx = idx;
        item.$key = this.key;
        this.classNames[idx] = item.linkageClassName;
    };
    /**
     * 遍历当前类型所有的控件
     *
     * @param {ComWillCheckParser} handler 处理函数
     * @param {Solution} solution
     * @param {any[]} [param] 处理函数的参数
     */
    ComWillCheck.prototype.forEach = function (handler, solution, param) {
        var dict = this.dict;
        for (var name_1 in dict) {
            var item = dict[name_1];
            handler(this, item, param, solution);
        }
    };
    return ComWillCheck;
}());
