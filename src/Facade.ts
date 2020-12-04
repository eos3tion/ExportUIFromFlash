/**
 * 用于导入脚本
 * 注册检查器和处理器
 */
let xml = XML(dom.exportPublishProfileString());
/**
 * 导出的JPG品质
 */
const JPG_QUALITY: number = (+xml.PublishJpegProperties.Quality) || 80;

var useShortName: boolean;

/**
 * 当前处理的fla的名字
 */
//! xml..flashFileName 这个为 e4x 规范的语法，后来被弃用，jsfl 可以使用
var flaname = xml..flashFileName.toString().replace(".swf", "") || dom.name.replace(".fla", "");

/**
 * 最终数据和纹理输出的目录
 * outputBase + flaname + "/"
 */
var folder = outputBase + flaname + "/";


if (typeof exportWebp === "undefined") {
    exportWebp = true;//默认为true
}

if (typeof exportRaw === "undefined") {
    exportRaw = false;
}

if (typeof useRaw === "undefined") {
    useRaw = false;
}

if (typeof checkJPG === "undefined") {
    checkJPG = false;
}


// 如果没有文件，创建输出路径
if (!FLfile.exists(folder)) {
    FLfile.createFolder(folder);
}


try {
    Script.runFolderScripts("utils");
    Script.runFolderScripts("core");
    Script.runFolderScripts("blockpacker");
    Script.runFolderScripts("parsers");
    Script.runScript("Solution");

    let sol = new Solution();

    // 注册检查器和处理器
    // 注册JunyouH5的检查器
    Script.runFolderScripts("parsers/junyouh5");
    //九宫元件
    sol.regComChecker(new ScaleBitmapParser());

    sol.regComChecker(new ArtTextParser());

    sol.regComChecker(new NumericStepperParser());

    sol.regComChecker(new ComWillCheck(ExportType.Slider, /^ui[.](slider)[.]/, MovieClipParser.prototype.doParser, "Slider"));

    sol.regComChecker(new ScrollBarParser());

    sol.regComChecker(new SlotBgParser());
    //绑定进度条
    sol.regComChecker(new ProgressBarParser());

    sol.regComChecker(new ShareBitmapParser());
    //绑定格位
    sol.regComChecker(new SlotParser());
    //艺术文字
    sol.regComChecker(new ArtWordParser());
    //影片剪辑
    sol.regComChecker(new MovieClipParser());
    //基于影片剪辑的按钮
    sol.regComChecker(new ComWillCheck(ExportType.MCButton, /^ui[.](mcbtn)[.]/, MovieClipParser.prototype.doParser, "MCButton"))
    //基于影片剪辑的ProgressBar
    sol.regComChecker(new ComWillCheck(ExportType.MCProgress, /^ui[.](mcprogress)[.]/, MovieClipParser.prototype.doParser, "ProgressBar"))
    // 加载代码生成器
    Script.runScript("generators/JunyouH5GeneratorV2");
    // 注册生成器
    sol.generator = new JunyouH5GeneratorV2(sol);

    sol.run();
    alert("执行完成");
} catch (e) {
    //输出未捕获的异常
    fl.trace(e.message + "\n" + e.stack)
}
