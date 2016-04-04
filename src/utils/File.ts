/**
 * 用于文件处理
 * @author 3tion
 */
class FileUtils {


    /**
     * 写文件
     * @throw "路径不合法";
     * @static
     * @param {string} data         要写入的数据
     * @param {string} pathURI      文件路径
     * @param {string} fileName     文件名
     * @returns {boolean} true 写入成功 false 写入失败
     */
    public static writeFile(data: string, pathURI: string, fileName: string): boolean;
    /**
     * 写文件
     * @throw "路径不合法";
     * @static
     * @param {string} data         要写入的数据
     * @param {string} fileURI      文件URI
     * @returns {boolean} true 写入成功 false 写入失败
     */
    public static writeFile(data: string, fileURI: string): boolean;
    public static writeFile(data: string, pathURI: string, fileName?: string): boolean {
        return this._writeFile(data, pathURI, fileName);
    }

    /**
     * 在文件尾追加数据
     * @throw "路径不合法";
     * @static
     * @param {string} data         要追加的数据
     * @param {string} pathURI      文件路径
     * @param {string} fileName     文件名
     * @returns {boolean} true 写入成功 false 写入失败
     */
    public static appendFile(data: string, pathURI: string, fileName: string): boolean;
    /**
     * 在文件尾追加数据
     * @throw "路径不合法";
     * @static
     * @param {string} data         要追加的数据
     * @param {string} fileURI      文件URI
     * @returns {boolean} true 写入成功 false 写入失败
     */
    public static appendFile(data: string, fileURI: string): boolean;
    public static appendFile(data: string, pathURI: string, fileName?: string): boolean {
        return this._writeFile(data, pathURI, fileName, "append");
    }

    private static _writeFile(data: string, pathURI: string, fileName: string , mode: string = ""): boolean {
        if (!fileName) {
            let idx = pathURI.lastIndexOf("/");
            fileName = pathURI.substr(idx + 1);
            pathURI = pathURI.substr(0, idx);
        }
        if (FLfile.createFolder(pathURI)) {
            return FLfile.write(pathURI + "/" + fileName, data , mode);
        }else {
            return false;
        }
    }

    /**
     * 模板必须放在templates目录下
     * 
     * @static
     * @param {string} path 基于templates的相对目录
     * @returns {string} 模板数据
     */
    public static loadTemplate(path: string): string {
        return FLfile.read(cwd + "templates/" + path);
    }
}