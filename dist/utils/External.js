var External = (function () {
    function External() {
    }
    /**
    * https://pngquant.org/
    * 使用pngquant优化输出的图片
    * @param {string} name 图片文件名
    */
    External.pngquant = function (name) {
        var path = FLfile.uriToPlatformPath(cwd);
        name = FLfile.uriToPlatformPath(name);
        var command = "cd /d " + path + "\n" + "pngquant.exe " + name + " -f --ext .png";
        FLfile.write(cwd + "tmp.bat", command);
        FLfile.runCommandLine(path + "tmp.bat");
        Log.trace(cwd + "tmp.bat");
        Log.trace(command);
    };
    return External;
}());
