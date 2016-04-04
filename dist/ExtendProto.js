/**
 * 用于扩展基础数据结构
 */
/**
 * 对数字进行补0操作
 * @param value 要补0的数值
 * @param length 要补的总长度
 * @return 补0之后的字符串
 */
function zeroize(value, length) {
    if (length === void 0) { length = 2; }
    var str = "" + value;
    var zeros = "";
    for (var i = 0, len = length - str.length; i < len; i++) {
        zeros += "0";
    }
    return zeros + str;
}
;
/**
 * 替换字符串中{0}{1}{2}{a} {b}这样的数据，用obj对应key替换，或者是数组中对应key的数据替换
 */
String.prototype.substitute = function () {
    var len = arguments.length;
    if (len > 0) {
        var obj_1;
        if (len === 1) {
            obj_1 = arguments[0];
            if (typeof obj_1 !== "object") {
                obj_1 = arguments;
            }
        }
        else {
            obj_1 = arguments;
        }
        if ((obj_1 instanceof Object) && !(obj_1 instanceof RegExp)) {
            return this.replace(/\{([^{}]+)\}/g, function (match, key) {
                var value = obj_1[key];
                return (value !== undefined) ? "" + value : "";
            });
        }
    }
    return this;
};
/**
 * 格式化日期
 */
Date.prototype.format = function (mask) {
    var d = this;
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
