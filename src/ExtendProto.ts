/**
 * 用于扩展基础数据结构
 */

/**
 * 对数字进行补0操作
 * @param value 要补0的数值
 * @param length 要补的总长度
 * @return 补0之后的字符串
 */
function zeroize(value: number | string, length: number = 2): string {
    let str = "" + value;
    let zeros = "";
    for (let i = 0, len = length - str.length; i < len; i++) {
        zeros += "0";
    }
    return zeros + str;
}
/****************************************扩展String****************************************/
interface String {
    /**
     * 替换字符串中{0}{1}{2}{a} {b}这样的数据，用obj对应key替换，或者是数组中对应key的数据替换
     */
    substitute(...args): string;
}
/**
 * 替换字符串中{0}{1}{2}{a} {b}这样的数据，用obj对应key替换，或者是数组中对应key的数据替换
 */
String.prototype.substitute = function () {
    let len = arguments.length;
    if (len > 0) {
        let obj;
        if (len === 1) {
            obj = arguments[0];
            if (typeof obj !== "object") {
                obj = arguments;
            }
        } else {
            obj = arguments;
        }
        if ((obj instanceof Object) && !(obj instanceof RegExp)) {
            return this.replace(/\{([^{}]+)\}/g, function (match, key) {
                let value = obj[key];
                return (value !== undefined) ? "" + value : "";
            });
        }
    }
    return this;
};


interface Array<T> {
    /**
     * 如果数组中没有要放入的对象，则将对象放入数组
     * 
     * @param {T} t 要放入的对象
     * @returns {number} 放入的对象，在数组中的索引
     * 
     * @memberof Array
     */
    pushOnce(t: T): number;

    /**
    * 
    * 删除某个数据
    * @param {T} t
    * @returns {boolean}   true 有这个数据并且删除成功
    *                      false 没有这个数据
    */
    remove(t: T): boolean;
}

Array.prototype.pushOnce = function <T>(this: T[], t: T) {
    let idx = this.indexOf(t);
    if (!~idx) {
        idx = this.length;
        this[idx] = t;
    }
    return idx;
}
Array.prototype.remove = function <T>(this: T[], t: T) {
    let idx = this.indexOf(t);
    if (~idx) {
        this.splice(idx, 1);
        return true;
    }
    return false;
}
/****************************************扩展Date****************************************/
interface Date {
    format(mask: string): string;
}

/**
 * 格式化日期
 */
Date.prototype.format = function (mask) {
    let d = this;
    return mask.replace(/"[^"]*"|'[^']*'|(?:d{1,2}|m{1,2}|yy(?:yy)?|([hHMs])\1?)/g, function ($0) {
        switch ($0) {
            case "d": return d.getDate();
            case "dd": return zeroize(d.getDate());
            case "M": return d.getMonth() + 1;
            case "MM": return zeroize(d.getMonth() + 1);
            case "yy": return String(d.getFullYear()).substr(2);
            case "yyyy": return d.getFullYear();
            case "h": return d.getHours() % 12 || 12;
            case "hh": return zeroize(d.getHours() % 12 || 12);
            case "H": return d.getHours();
            case "HH": return zeroize(d.getHours());
            case "m": return d.getMinutes();
            case "mm": return zeroize(d.getMinutes());
            case "s": return d.getSeconds();
            case "ss": return zeroize(d.getSeconds());
            default: return $0.substr(1, $0.length - 2);
        }
    });
};
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () { },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP
                    ? this
                    : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        if (this.prototype) {
            // Function.prototype doesn't have a prototype property
            fNOP.prototype = this.prototype;
        }
        fBound.prototype = new fNOP();

        return fBound;
    };
}

class Script {

    private static getDist() {
        return cwd + "/dist/";
    }

    /**
     * 运行指定脚本文件
     * @param {string} file 文件相对路径
     */
    public static runScript(file: string) {
        if (file.substr(-3).toLowerCase() !== ".js") {
            file += ".js";
        }
        let path = this.getDist() + file;
        if (FLfile.exists(path)) {
            fl.runScript(path);
        }
    }

    /**
     * 运行指定路径的所有脚本（不处理子目录）
     * 
     * @param {string} path 文件夹相对路径
     */
    public static runFolderScripts(path) {
        if (path.charAt(path.length - 1) !== "/") {
            path += "/";
        }
        let pathURI = this.getDist() + path;
        let list = FLfile.listFolder(pathURI, "files");
        for (let i = 0, len = list.length; i < len; i++) {
            let file = pathURI + list[i];
            fl.runScript(file);
        }
    }
}

/**
 * 检查文件内容是否相同
 * 
 * @private
 * @param {string} path         要检查的文件路径
 * @param {string} content     新的内容
 * @returns 
 */
function checkCodeSame(path: string, content: string) {
    if (FLfile.exists(path)) {
        let old = FLfile.read(path);
        return minifyCode(old) == minifyCode(content);
    }
    return false;
}
/**
 * 最小化代码，用于比较代码内容是否相同
 * @param code 
 */
function minifyCode(code) {
    var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
        in_string = false,
        in_multiline_comment = false,
        in_singleline_comment = false,
        tmp, tmp2, new_str = [], ns = 0, from = 0, lc: string, rc: string;

    tokenizer.lastIndex = 0;

    while (tmp = tokenizer.exec(code)) {
        lc = RegExp["$`"];
        rc = RegExp["$'"];
        if (!in_multiline_comment && !in_singleline_comment) {
            tmp2 = lc.substring(from);
            if (!in_string) {
                tmp2 = tmp2.replace(/(\n|\r|\s)*/g, "");
            }
            new_str[ns++] = tmp2;
        }
        from = tokenizer.lastIndex;

        if (tmp[0] == "\"" && !in_multiline_comment && !in_singleline_comment) {
            tmp2 = lc.match(/(\\)*$/);
            if (!in_string || !tmp2 || (tmp2[0].length % 2) == 0) {	// start of string with ", or unescaped " character found to end string
                in_string = !in_string;
            }
            from--; // include " character in next catch
            rc = code.substring(from);
        }
        else if (tmp[0] == "/*" && !in_string && !in_multiline_comment && !in_singleline_comment) {
            in_multiline_comment = true;
        }
        else if (tmp[0] == "*/" && !in_string && in_multiline_comment && !in_singleline_comment) {
            in_multiline_comment = false;
        }
        else if (tmp[0] == "//" && !in_string && !in_multiline_comment && !in_singleline_comment) {
            in_singleline_comment = true;
        }
        else if ((tmp[0] == "\n" || tmp[0] == "\r") && !in_string && !in_multiline_comment && in_singleline_comment) {
            in_singleline_comment = false;
        }
        else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(tmp[0]))) {
            new_str[ns++] = tmp[0];
        }
    }
    new_str[ns++] = rc;
    return new_str.join("");
}