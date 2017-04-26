class FLExternal {

    /**
    * https://pngquant.org/
    * 使用pngquant优化输出的图片
    * @param {string} name 图片文件名
    */
    public static pngquant(name: string) {
        let wcwd = FLfile.uriToPlatformPath(cwd);
        name = FLfile.uriToPlatformPath(name);
        let command = `${wcwd}exe\\pngquant.exe ${name} -f --ext .png`;
        Log.trace(command);
        FLfile.runCommandLine(command);
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
        let wcwd = FLfile.uriToPlatformPath(cwd);
        name = FLfile.uriToPlatformPath(out || name);
        out = out ? FLfile.uriToPlatformPath(out) : name;
        //对原始文件名增加webp后缀
        let command = `${wcwd}exe\\cwebp.exe ${name} -o ${out}.webp`;
        Log.trace(command);
        FLfile.runCommandLine(command);
    }
}
