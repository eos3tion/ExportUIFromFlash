/**
 * 用于文件处理
 * @author 3tion
 */
var FileUtils = (function () {
    function FileUtils() {
    }
    FileUtils.writeFile = function (data, pathURI, fileName) {
        return this._writeFile(data, pathURI, fileName);
    };
    FileUtils.appendFile = function (data, pathURI, fileName) {
        return this._writeFile(data, pathURI, fileName, "append");
    };
    FileUtils._writeFile = function (data, pathURI, fileName, mode) {
        if (mode === void 0) { mode = ""; }
        if (!fileName) {
            var idx = pathURI.lastIndexOf("/");
            fileName = pathURI.substr(idx + 1);
            pathURI = pathURI.substr(0, idx);
        }
        if (FLfile.createFolder(pathURI)) {
            return FLfile.write(pathURI + "/" + fileName, data, mode);
        }
        else {
            return false;
        }
    };
    /**
     * 模板必须放在templates目录下
     *
     * @static
     * @param {string} path 基于templates的相对目录
     * @returns {string} 模板数据
     */
    FileUtils.loadTemplate = function (path) {
        return FLfile.read(cwd + "templates/" + path);
    };
    return FileUtils;
}());
