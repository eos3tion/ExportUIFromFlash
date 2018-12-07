/**
 * 君游H5项目的代码生成器
 * JunyouH5Generator
 */
class JunyouH5GeneratorV2 implements IPanelGenerator {

    /**
     * 面板模板
     */
    private _panelTmp: string;
    /**
     * 内部容器的模板
     */
    private _containerTmp: string;
    /**
     * mediator的模板
     */
    private _mediatorTmp: string;

    /**
     * yyhdMediator的模板
     */
    private _yyhdMediatorTmp: string;


    /**
     * View Render的模板
     * 
     * @private
     * @type {string}
     */
    private _viewTmp: string;

    /**
     * MovieClip的模板
     */
    private _mcTmp: string;

    /**
     * MCButton的模板
     */
    private _mcBtnTmp: string;

    /**
     * MCProgress的模板
     */
    private _mcProgressTmp: string;
    /**
     * 解决方案
     */
    private _solution: Solution;

    constructor(solution: Solution) {
        this._solution = solution;
        this.init();
    }

    private init() {
        let prefix = "junyouh5/v2/";
        this._panelTmp = FileUtils.loadTemplate(prefix + "Panel.template");
        this._containerTmp = FileUtils.loadTemplate(prefix + "Container.template");
        this._mediatorTmp = FileUtils.loadTemplate(prefix + "Mediator.template");
        this._viewTmp = FileUtils.loadTemplate(prefix + "View.template");
        this._yyhdMediatorTmp = FileUtils.loadTemplate(prefix + "YYHDMediator.template");
        this._mcBtnTmp = FileUtils.loadTemplate(prefix + "MCButton.template");
        this._mcTmp = FileUtils.loadTemplate(prefix + "MovieClip.template");
        this._mcProgressTmp = FileUtils.loadTemplate(prefix + "MCProgress.template");
    }
    private getPanelName(className: string) {
        let result = this.parsePanelName(className);
        if (result) {
            return result.panelName;
        }
    }

    private parsePanelName(className: string) {
        let result = /^ui[.](.*)[.]((.*?)(Panel|Dele|Render|View))$/.exec(className);
        if (result) {
            let module = result[1];
            let panelName = result[2];
            let shortName = result[3];
            return { module, shortName, panelName };
        }
    }
    /**
     * 生成面板代码
     */
    generateOnePanel(className: string, pInfo: any[], size: number[]) {
        let result = this.parsePanelName(className);
        // /^ui[.](.*?)[.]((.*?)(Panel|Dele))$/.exec("ui.ShangCheng.ShangChengPanel")
        // ["ui.ShangCheng.ShangChengPanel", "ShangCheng", "ShangChengPanel", "ShangCheng", "Panel"]
        if (result) {
            let mod = result.module || "";
            mod = mod.replace(/[.]/g, "/");//用于支持多级目录
            let modFolder = classRoot + mod;
            if (!FLfile.exists(modFolder)) {
                FLfile.createFolder(modFolder);
            }
            let panelName = result.panelName;
            // data[0] ComponentType
            // data[1] BaseData
            // data[2] ComponentData
            // data[3] lib

            // [[3,["btn2", 14.5, 139, 79, 28, 0], 0, 0],
            // [3, ["btn3", 24.5, 139, 79, 28, 0], 0, 0], 
            // [1, ["txtLabel", 33, 149.55, 156, 17.45, 0],[1, "Times New Roman", 0, "#0066CC", 12, 0, 0, 0]],
            // [3, ["btn4", 103.5, 133.45, 79, 28, 0], 0, 0], 
            // [3, ["btn1", 24.5, 121.55, 79, 28, 0], 0, 0]]
            // template;
            let classInfo = { classes: {}, depends: [] } as ClassInfo;
            let classes = classInfo.classes;
            let createtime = new Date().format("yyyy-MM-dd HH:mm:ss");
            let dclar = "";
            // Log.trace("开始处理：", panelName);
            if (panelName.indexOf("View") != -1 || panelName.indexOf("Render") != -1) {
                this.generateClass(this._viewTmp, panelName, pInfo, classInfo);
            } else {
                dclar = "declare ";
                this.generateClass(this._panelTmp, panelName, pInfo, classInfo);
            }

            let otherDepends = "";
            if (classInfo.depends.length) {
                otherDepends = ", " + classInfo.depends.join(", ");
            }
            let classStr = classes[panelName];
            delete classes[panelName];
            classStr = classStr.replace("@className@", className)
                .replace(/@otherDepends@/g, otherDepends)
                .replace(/@lib@/g, flaname)
                .replace(/@className@/g, className);
            let str = dclar + "namespace " + moduleName + " {\n\t" + classStr.replace(/\n/g, "\n\t") + "\n";
            for (let className in classes) {
                str += "\t" + classes[className].replace(/\n/g, "\n\t") + "\n";
            }
            str += "\n}";
            // 检查是否有原始文件，并检查原始文件和当前文件的核心内容是否相同，如果相同，则不生成文件
            let ext = dclar ? ".d.ts" : ".ts";
            let path = modFolder + "/" + panelName + ext;
            if (checkCodeSame(path, str)) {
                Log.trace(`${path}和新生成内容相同，无需生成！`);
            } else {
                FLfile.write(path, str.replace(/@createTime@/g, createtime));
            }
            // 生成mediator
            let tmp: string;
            let mediatorName = useShortName ? result.shortName : panelName;
            if (panelName.indexOf("YYHD") == -1) {
                mediatorName = mediatorName + "Mediator";
                tmp = this._mediatorTmp;
            }
            else {
                mediatorName = mediatorName + "Mediator";
                tmp = this._yyhdMediatorTmp;
            }
            str = "namespace " + moduleName + " {\n" +
                tmp.replace(/@mediatorName@/g, mediatorName)
                    .replace(/@panelName@/g, panelName)
                    .replace(/@createTime@/g, createtime)
                    .replace(/@otherDepends@/g, otherDepends)
                    .replace(/@lib@/g, flaname)
                    .replace(/@className@/g, className)
                    .replace(/\n/g, "\n\t")
                + "\n}";
            let mediatorOut = modFolder + "/" + mediatorName + ".ts";
            let flag = true;
            if (checkCodeSame(mediatorOut, str)) {
                Log.trace(`${mediatorOut}和新生成内容相同，无需生成！`);
            } else {
                if (panelName.indexOf("Panel") != -1 || panelName.indexOf("Dele") != -1) {
                    if (FLfile.exists(mediatorOut)) {
                        flag = confirm("指定目录下，已经有：" + FLfile.uriToPlatformPath(mediatorOut) + "，是否保留原先的代码？？？");
                        if (!flag) {
                            FLfile.copy(mediatorOut, mediatorOut + "_" + new Date().valueOf() + ".bak");//增加一个备份
                            FLfile.write(mediatorOut, str);
                        }
                    }
                    else {
                        FLfile.write(mediatorOut, str);
                    }
                }
            }
        } else {
            Log.throwError("面板名字有误！", className);
        }
    }

    private generateClass(tempate: string, panelName: string, pInfo: any[], classInfo: ClassInfo, ident = "\t") {
        let pros = [];
        let compCheckers = this._solution.compCheckers;
        for (let i = 0, len = pInfo.length; i < len; i++) {
            let data = pInfo[i];
            let type = data[0];
            let baseData = data[1];
            let instanceName = baseData[0];
            if (!instanceName && type != ExportType.Container) {
                continue;
            }
            switch (type) {
                case ExportType.Rectangle:
                    pros.push(`${ident}${instanceName}: egret.Rectangle;`);
                    break;
                case ExportType.Sprite:
                    pros.push(`${ident}${instanceName}: egret.Sprite;`);
                    break;
                case ExportType.ImageLoader:
                    pros.push(`${ident}${instanceName}: Image;`);
                    break;
                case ExportType.Image:
                    pros.push(`${ident}${instanceName}: egret.Bitmap;`);
                    break;
                case ExportType.Text:
                    pros.push(`${ident}${instanceName}: egret.TextField;`);
                    break;
                case ExportType.MCButton:
                    this.sovleMCComponent(type, instanceName, data, pros, panelName, ident, classInfo);
                    break;
                case ExportType.Container:
                    if (instanceName) {//匿名的不生成
                        let cName = panelName + "_" + instanceName;
                        this.generateClass(this._containerTmp, cName, data[2], classInfo);
                        pros.push(`${ident}${instanceName}: ${cName};`);
                    }
                    break;
                default: // 控件
                    let strKey = data[3];
                    if (strKey && strKey != 1) {
                        if (!~classInfo.depends.indexOf(strKey)) {
                            classInfo.depends.push(strKey);
                        }
                    }
                    if (instanceName) {
                        if (type in compCheckers) {
                            let c = compCheckers[type];
                            if (c) {
                                if (type == ExportType.MovieClip) {
                                    let idx = data[2];
                                    let list = c.list;
                                    let dat = list && list[idx];
                                    //找到对应实例
                                    let className = dat && dat[2];
                                    if (className) {
                                        className = MovieClipParser.getMCClassName(className);
                                        pros.push(`${ident}${instanceName}: ${className};`);
                                    } else {
                                        pros.push(`${ident}${instanceName}: ${c.componentName};`);
                                    }
                                } else {
                                    pros.push(`${ident}${instanceName}: ${c.componentName};`);
                                }
                            } else {
                                Log.throwError("面板进行生成代码，无法找到类型:", JSON.stringify(data));
                            }

                        } else if (type == ExportType.ExportedContainer) {
                            let idx = data[2];
                            let panelName = this._solution.panelNames[idx];
                            if (panelName) {
                                pros.push(`${ident}${instanceName}: ${this.getPanelName(panelName)};`);
                            } else {
                                Log.throwError("面板进行生成代码，无法找到类型:", JSON.stringify(data));
                            }
                        }
                    }
                    break;
            }
        }
        let properties = pros.join("\n");
        let classStr;
        if (panelName.indexOf("View") != -1 || panelName.indexOf("Render") != -1) {
            classStr = tempate.replace("@export@", "export ");
        } else {
            classStr = tempate.replace("@export@", "");
        }
        classStr = classStr
            .replace(/@panelName@/g, panelName)
            .replace("@properties@", properties);

        classInfo.classes[panelName] = classStr;
    }

    sovleMCComponent(type: ExportType, instanceName: string, data: any, pros: string[], panelName: string, ident: string, classInfo: ClassInfo) {
        let dat = data[2];
        let className: string;
        if (typeof dat === "string") {
            className = MovieClipParser.getMCClassName(dat);
        }
        let classes = classInfo.classes;
        if (className) {
            let temp = type == ExportType.MCButton ? this._mcBtnTmp : this._mcProgressTmp;
            let cName = panelName + "_" + instanceName;
            classes[cName] = temp.replace("@mcName@", className).replace("@panelName@", cName);
            pros.push(`${ident}${instanceName}: ${cName};`);
        } else if (type == ExportType.MCButton) {//只有MCButton允许使用匿名MC
            let dat = data[2];
            let cName: string;
            if (dat && dat instanceof Array) {
                cName = panelName + "_" + instanceName;
                let className = panelName + "_" + instanceName + "_MC";
                classes[cName] = this._mcBtnTmp.replace("@mcName@", className).replace("@panelName@", cName);
                this.generateClass(this._mcTmp, className, dat[0], classInfo, ident);
            } else {
                cName = "MCButton";
            }
            pros.push(`${ident}${instanceName}: ${cName};`);
        } else {
            Log.throwError("MCProgress数据有误，数据没有类名");
        }
    }

    generateMCs(mcComponents: MovieClipDict, flaName: string) {
        let classes = {};
        let classInfo = { classes, depends: [] } as ClassInfo;
        //生成MC对应类型文件
        for (let className in mcComponents) {
            let mcData = mcComponents[className];
            let { data, type } = mcData;
            let mcName: string;
            switch (type) {
                case ExportType.MCButton:
                case ExportType.MCProgress:
                    let tmp = type == ExportType.MCButton ? this._mcBtnTmp : this._mcProgressTmp;
                    mcName = className + "_MC";
                    classes[className] = tmp.replace("@mcName@", mcName).replace("@panelName@", className);
                    break;
                default:
                    mcName = className;
                    break;
            }
            this.generateClass(this._mcTmp, mcName, data[0], classInfo, "\t");
        }
        let str = "";

        for (let className in classes) {
            str += "\t" + classes[className].replace(/\n/g, "\n\t") + "\n";
        }
        if (!str) {
            return;
        }
        let ext = ".d.ts";
        let flaFolder = classRoot + "fla/";
        if (!FLfile.exists(flaFolder)) {
            FLfile.createFolder(flaFolder);
        }
        let path = flaFolder + flaName + ext;
        str = "declare namespace " + moduleName + " {\n" +
            str
            + "\n}";
        if (checkCodeSame(path, str)) {
            Log.trace(`${path}和新生成内容相同，无需生成！`);
        } else {
            FLfile.write(path, str);
        }
    }
}

interface ClassInfo {
    classes: any;
    depends: any[]
}