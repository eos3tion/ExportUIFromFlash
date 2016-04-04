class FLExternal {

     /**
     * https://pngquant.org/
     * 使用pngquant优化输出的图片
     * @param {string} name 图片文件名
     */
    public static pngquant (name: string) {
        let path = FLfile.uriToPlatformPath(cwd);
        name = FLfile.uriToPlatformPath(name);
        let command = "cd /d " + path + "\n" + "pngquant.exe " + name + " -f --ext .png";
        FLfile.write(cwd + "tmp.bat", command);
        FLfile.runCommandLine(path + "tmp.bat");
        Log.trace(cwd + "tmp.bat");
        Log.trace(command);
    }
}
