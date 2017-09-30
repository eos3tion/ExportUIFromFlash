class Log {
    /**用于文本保存日志的数据 */
    private static _log = "";

    /**
     * 让jsfl产生一个异常
     * 并写入日志
     */
    public static throwError(...args) {
        let len = args.length;
        let str = "";
        for (let i = 0; i < len; i++) {
            str += args[i] + "\t";
        }
        this._log += str;
        try {
            throw new Error();
        } catch (e) {
            alert(str + "  " + e.stack);
        }
        //中断
        throw new Error();
    }

    /**
     * 输入到控制台
     * 并将输出写入日志
     */
    public static trace(...args) {
        fl.trace(Log.log(...args));
    }

    public static log(...args) {
        let len = args.length;
        let str = "";
        for (let i = 0; i < len; i++) {
            str += args[i] + "\t";
        }
        this._log += str + "\n";
        return str;
    }

    /**
     * 输出文件
     * 
     * @static
     * @param {string} file (description)
     */
    public static output(fileName: string) {
        let log = new Date().format("yyyy-MM-dd HH:mm:ss") + "========================================================\n" + this._log + "------------------------------------------------------\n\n\n";
        FLfile.write(cwd + fileName, log, "append");
    }
}