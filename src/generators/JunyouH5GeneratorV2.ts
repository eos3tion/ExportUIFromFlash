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
    }
    private getPanelName(className: string) {
        let result = this.parsePanelName(className);
        if (result) {
            return result.panelName;
        }
    }

    private parsePanelName(className: string) {
        let result = /^ui[.](.*?)[.]((.*?)(Panel|Dele|Render|View))$/.exec(className);
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
            let mod = result.module;
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
            let classInfo = { classes: {}, depends: [] };
            let classes = classInfo.classes;
            let createtime = new Date().format("yyyy-MM-dd HH:mm:ss");
            // Log.trace("开始处理：", panelName);
            if (panelName.indexOf("View") != -1 || panelName.indexOf("Render") != -1) {
                this.generateClass(this._viewTmp, panelName, pInfo, classInfo);
            } else {
                this.generateClass(this._panelTmp, panelName, pInfo, classInfo);
            }

            let otherDepends = "";
            if (classInfo.depends.length) {
                otherDepends = ", " + classInfo.depends.join(", ");
            }
            let classStr: string = classes[panelName];
            delete classes[panelName];
            classStr = classStr.replace("@className@", className)
                .replace(/@otherDepends@/g, otherDepends)
                .replace(/@lib@/g, flaname)
                .replace(/@className@/g, className);
            let str = "module " + moduleName + " {\n\t" + classStr.replace(/\n/g, "\n\t") + "\n";
            for (let className in classes) {
                str += "\t" + classes[className].replace(/\n/g, "\n\t") + "\n";
            }
            str += "\n}";
            // 检查是否有原始文件，并检查原始文件和当前文件的核心内容是否相同，如果相同，则不生成文件
            let path = modFolder + "/" + panelName + ".ts";
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
            str = "module " + moduleName + " {\n" +
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

    private generateClass(tempate: string, panelName: string, pInfo: any[], classInfo: { classes: any, depends: any[] }, ident = "\t") {
        let pros = [];
        let idx = 0;
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
                                pros.push(`${ident}${instanceName}: ${c.componentName};`);
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
}