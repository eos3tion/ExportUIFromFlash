/**
 * 用于导入脚本
 * 注册检查器和处理器
 */
let xml = XML(dom.exportPublishProfileString());
/**
 * 导出的JPG品质
 */
const JPG_QUALITY: number = (+xml.PublishJpegProperties.Quality) || 80;

/**
 * 当前处理的fla的名字
 */
var flaname = xml..flashFileName.toString().replace(".swf", "") || dom.name.replace(".fla", "");

/**
 * 最终数据和纹理输出的目录
 * outputBase + flaname + "/"
 */
var folder = outputBase + flaname + "/";

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

    // 绑定按钮
    sol.regComChecker(new ButtonParser());
    //绑定分页控件
    //sol.regComChecker(new PageControlerParser());

    sol.regComChecker(new ArtTextParser());

    sol.regComChecker(new NumericStepperParser());

    sol.regComChecker(new SliderParser());

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
