class Script {

    private static getDist() {
        return cwd + "/dist/";
    }

    /**
     * 运行指定脚本文件
     * @param {string} file 文件相对路径
     */
    public static runScript(file: string) {
        if ( file.substr(-3).toLowerCase() !== ".js" ){
            file += ".js";
        }
        let path = this.getDist() + file;
        if (FLfile.exists(path)) {
            fl.runScript( path );
        }
    }

    /**
     * 运行指定路径的所有脚本（不处理子目录）
     * 
     * @param {string} path 文件夹相对路径
     */
    public static runFolderScripts(path) {
        if (path.charAt(path.length - 1) !== "/"){
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