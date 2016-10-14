/**
 * 君游H5项目的代码生成器
 * JunyouH5Generator
 */
var JunyouH5Generator = (function () {
    function JunyouH5Generator(solution) {
        this._solution = solution;
        this.init();
    }
    JunyouH5Generator.prototype.init = function () {
        var prefix = "junyouh5/";
        this._panelTmp = FileUtils.loadTemplate(prefix + "Panel.template");
        this._containerTmp = FileUtils.loadTemplate(prefix + "Container.template");
        this._mediatorTmp = FileUtils.loadTemplate(prefix + "Mediator.template");
    };
    /**
     * 生成面板代码
     */
    JunyouH5Generator.prototype.generateOnePanel = function (className, pInfo, size) {
        var result = /^ui[.](.*?)[.](.*?(Panel|Dele|Render|View|"))$/.exec(className);
        // /^ui[.](.*?)[.]((.*?)(Panel|Dele))$/.exec("ui.ShangCheng.ShangChengPanel")
        // ["ui.ShangCheng.ShangChengPanel", "ShangCheng", "ShangChengPanel", "ShangCheng", "Panel"]
        if (result) {
            var mod = result[1];
            var modFolder = classRoot + mod;
            if (!FLfile.exists(modFolder)) {
                FLfile.createFolder(modFolder);
            }
            var panelName = result[2];
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
            var classInfo = { classes: {}, depends: [] };
            var classes = classInfo.classes;
            var createtime = new Date().format("yyyy-MM-dd HH:mm:ss");
            if (panelName.indexOf("View") != -1 || panelName.indexOf("Render") != -1) {
                this.generateClass(this._containerTmp, panelName, pInfo, classInfo);
            }
            else {
                this.generateClass(this._panelTmp, panelName, pInfo, classInfo);
            }
            var otherDepends = "";
            if (classInfo.depends.length) {
                otherDepends = "this._otherDepends = [" + classInfo.depends.join(",") + "];";
            }
            var classStr = classes[panelName];
            delete classes[panelName];
            classStr = classStr.replace("@className@", className)
                .replace("@otherDepends@", otherDepends).replace("@baseRect@", size.join(","));
            var str = "module " + moduleName + "{\r\nimport sui = junyou.sui;\r\n" + classStr + "\r\n";
            for (var className_1 in classes) {
                str += classes[className_1] + "\r\n";
            }
            str += "\r\n}\r\n";
            FLfile.write(modFolder + "/" + panelName + ".ts", str.replace(/@createTime@/g, createtime));
            // 生成mediator
            var mediatorName = panelName + "Mediator";
            str = "module " + moduleName + "{\r\n" + this._mediatorTmp.replace("@mediatorName@", mediatorName)
                .replace(/@panelName@/g, panelName).replace(/@createTime@/g, createtime) + "\r\n}\r\n";
            var mediatorOut = modFolder + "/" + mediatorName + ".ts";
            var flag = true;
            if (panelName.indexOf("Panel") != -1 || panelName.indexOf("Dele") != -1) {
                if (FLfile.exists(mediatorOut)) {
                    flag = confirm("指定目录下，已经有：" + FLfile.uriToPlatformPath(mediatorOut) + "，是否保留原先的代码？？？");
                    if (!flag) {
                        FLfile.copy(mediatorOut, mediatorOut + ".bak"); //增加一个备份
                        FLfile.write(mediatorOut, str);
                    }
                }
                else {
                    FLfile.write(mediatorOut, str);
                }
            }
        }
        else {
            Log.throwError("面板名字有误！", name);
        }
    };
    JunyouH5Generator.prototype.generateClass = function (tempate, panelName, pInfo, classInfo) {
        var comps = [], pros = [];
        var idx = 0;
        var compCheckers = this._solution.compCheckers;
        for (var i = 0, len = pInfo.length; i < len; i++) {
            var data = pInfo[i];
            var type = data[0];
            var baseData = data[1];
            var instanceName = baseData[0];
            switch (type) {
                case ExportType.Rectangle:
                    pros.push("public " + instanceName + ": egret.Rectangle;");
                    comps.push("this." + instanceName + " = new egret.Rectangle(" + baseData[1] + "," + baseData[2] + "," + baseData[3] + "," + baseData[4] + ");");
                    break;
                case ExportType.Image:
                    //comps.push("this.addChild(manager.createBitmapByData(this._key, " + JSON.stringify(data) + "));");
                    comps.push("dis = manager.createBitmapByData(this._key, " + JSON.stringify(data) + ");");
                    comps.push("this.addChild(dis);");
                    if (instanceName) {
                        pros.push("public " + instanceName + ": egret.Bitmap;");
                        comps.push("this." + instanceName + " = dis;");
                    }
                    break;
                case ExportType.Text:
                    comps.push("dis = manager.createTextFieldByData(this._key, " + JSON.stringify(data) + ");");
                    comps.push("this.addChild(dis);");
                    if (instanceName) {
                        pros.push("public " + instanceName + ": egret.TextField;");
                        comps.push("this." + instanceName + " = dis;");
                    }
                    break;
                case ExportType.Container:
                    if (instanceName.indexOf("$") == -1) {
                        var cName = panelName + "_" + idx;
                        this.generateClass(this._containerTmp, cName, data[2], classInfo);
                        comps.push("dis = new " + cName + "();");
                        comps.push("sui.SuiResManager.initBaseData(dis, " + JSON.stringify(baseData) + ");");
                        comps.push("this.addChild(dis);");
                        if (instanceName) {
                            pros.push("public " + instanceName + ":" + cName + ";");
                            comps.push("this." + instanceName + " = dis;");
                        }
                        idx++;
                    }
                    else {
                        var tp = instanceName.split("$")[0];
                        var tmpname = instanceName.split("$")[1];
                        var tmpd = data[2][0];
                        if (tp == "con") {
                            if (tmpd) {
                                pros.push("public " + tmpname + ":egret.Rectangle;");
                                comps.push("this." + tmpname + "=new egret.Rectangle();");
                            }
                            else {
                                pros.push("public " + tmpname + ":egret.Sprite;");
                                comps.push("this." + tmpname + "=new egret.Sprite();");
                            }
                        }
                        else {
                            pros.push("public " + tmpname + ":egret.Sprite;");
                            comps.push("this." + tmpname + "=new egret.Sprite();");
                        }
                        //tmpd[1][0]=tmpname;
                        if (tmpd) {
                            tmpd[1][1] = 0;
                            tmpd[1][2] = 0;
                        }
                        if (tp != "con") {
                            if (tmpd) {
                                comps.push("dis=manager.createBitmapByData(this._key, " + JSON.stringify(tmpd) + ");");
                                comps.push("this." + tmpname + ".addChild(dis);");
                            }
                        }
                        if (data[1][1] != 0) {
                            comps.push("this." + tmpname + ".x=" + data[1][1] + ";");
                        }
                        if (data[1][2] != 0) {
                            comps.push("this." + tmpname + ".y=" + data[1][2] + ";");
                        }
                        if (tp == "con") {
                            if (tmpd) {
                                comps.push("this." + tmpname + ".width=" + data[1][3] + ";");
                                comps.push("this." + tmpname + ".height=" + data[1][4] + ";");
                            }
                        }
                        if (tp == "con") {
                            if (!tmpd) {
                                comps.push("this.addChild(this." + tmpname + ");");
                            }
                        }
                        else {
                            comps.push("this.addChild(this." + tmpname + ");");
                        }
                    }
                    break;
                default:
                    var strKey = "this._key";
                    if (data[3]) {
                        if (data[3] === 1) {
                            strKey = "\"lib\"";
                        }
                        else {
                            strKey = data[3];
                            if (!~classInfo.depends.indexOf(strKey)) {
                                classInfo.depends.push(strKey);
                            }
                        }
                    }
                    if (data[0] in compCheckers) {
                        var ctype = data[0];
                        var c = compCheckers[ctype];
                        if (c) {
                            var className = c.classNames[data[2]];
                            // public createDisplayObject(uri:string,className:string,data:any):egret.DisplayObject
                            comps.push("dis = manager.createDisplayObject(" + strKey + ", \"" + className + "\", " + JSON.stringify(baseData) + ");");
                            comps.push("this.addChild(dis);");
                            if (instanceName) {
                                pros.push("public " + instanceName + ": " + c.componentName + ";");
                                comps.push("this." + instanceName + " = dis;");
                            }
                        }
                        else {
                            Log.throwError("面板进行生成代码，无法找到类名:", JSON.stringify(data));
                        }
                    }
                    break;
            }
        }
        var properties = pros.join("\r\n\t");
        var cops = comps.join("\r\n\t\t");
        var classStr;
        if (panelName.indexOf("View") != -1 || panelName.indexOf("Render") != -1) {
            classStr = tempate.replace("@class@", "export class ")
                .replace("@panelName@", panelName)
                .replace("@properties@", properties)
                .replace("@bindComponents@", cops)
                .replace("@lib@", flaname);
        }
        else {
            classStr = tempate.replace("@class@", "class ")
                .replace("@panelName@", panelName)
                .replace("@properties@", properties)
                .replace("@bindComponents@", cops)
                .replace("@lib@", flaname);
        }
        classInfo.classes[panelName] = classStr;
    };
    return JunyouH5Generator;
}());
