var Log = (function () {
    function Log() {
    }
    /**
     * 让jsfl产生一个异常
     * 并写入日志
     */
    Log.throwError = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var len = args.length;
        var str = "";
        for (var i = 0; i < len; i++) {
            str += args[i] + "\t";
        }
        this.log += str;
        try {
            throw new Error();
        }
        catch (e) {
            alert(str + "  " + e.stack);
        }
        //中断
        throw new Error();
    };
    /**
     * 输入到控制台
     * 并将输出写入日志
     */
    Log.trace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var len = args.length;
        var str = "";
        for (var i = 0; i < len; i++) {
            str += args[i] + "\t";
        }
        this.log += str + "\n";
        fl.trace(str);
    };
    /**
     * 输出文件
     *
     * @static
     * @param {string} file (description)
     */
    Log.output = function (fileName) {
        var log = new Date().format("yyyy-MM-dd HH:mm:ss") + "========================================================\n" + this.log + "------------------------------------------------------\n\n\n";
        FLfile.write(cwd + fileName, log, "append");
    };
    /**用于文本保存日志的数据 */
    Log.log = "";
    return Log;
}());
