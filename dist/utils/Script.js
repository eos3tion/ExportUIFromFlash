var Script = (function () {
    function Script() {
    }
    Script.getDist = function () {
        return cwd + "/dist/";
    };
    /**
     * 运行指定脚本文件
     * @param {string} file 文件相对路径
     */
    Script.runScript = function (file) {
        if (file.substr(-3).toLowerCase() !== ".js") {
            file += ".js";
        }
        var path = this.getDist() + file;
        if (FLfile.exists(path)) {
            fl.runScript(path);
        }
    };
    /**
     * 运行指定路径的所有脚本（不处理子目录）
     *
     * @param {string} path 文件夹相对路径
     */
    Script.runFolderScripts = function (path) {
        if (path.charAt(path.length - 1) !== "/") {
            path += "/";
        }
        var pathURI = this.getDist() + path;
        var list = FLfile.listFolder(pathURI, "files");
        for (var i = 0, len = list.length; i < len; i++) {
            var file = pathURI + list[i];
            fl.runScript(file);
        }
    };
    return Script;
}());
