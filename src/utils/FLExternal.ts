class FLExternal {

    /**
    * https://pngquant.org/
    * 使用pngquant优化输出的图片
    * @param {string} name 图片文件名
    */
    public static pngquant(name: string) {     
        let wcwd = FLfile.uriToPlatformPath(cwd);
        name = FLfile.uriToPlatformPath(name);
        let path = wcwd + "\\exe";
        let command = "cd /d " + path + "\n" + "pngquant.exe " + name + " -f --ext .png";
        FLfile.write(wcwd + "tmp.bat", command);
        FLfile.runCommandLine(wcwd + "tmp.bat");
        // 删除临时文件
        // FLfile.remove(wcwd + "tmp.bat");
        Log.trace(wcwd + "tmp.bat");
        Log.trace(command);
    }

    /**
     *  https://github.com/webmproject/libwebp  
     *  高版本的Android和Chrome默认原生支持webp
     * 
     * @static
     * @param {string} name 
     * @param {string} [out] 
     * 
     * @memberOf FLExternal
     */
    public static cwebp(name: string, out?: string) {
        out = out || name;
        let wcwd = FLfile.uriToPlatformPath(cwd);
        let bin = wcwd + "\\exe\\cwebp.exe";
        name = FLfile.uriToPlatformPath(name);
        //对原始文件名增加webp后缀
        let command = bin + " " + name + " -o " + out + ".webp\n";
        FLfile.write(wcwd + "tmp.bat", command);
        FLfile.runCommandLine(wcwd + "tmp.bat");
        // 删除临时文件
        // FLfile.remove(wcwd + "tmp.bat");
        Log.trace(wcwd + "tmp.bat");
        Log.trace(command);
    }
}
