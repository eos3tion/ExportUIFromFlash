// 定义全局对象
var dom = fl.getDocumentDOM();
var lib = dom.library;
var flaname = dom.name.replace(".fla", "");
// 日志路径
var LOG_FILE = "log.txt";
// 导出的数据
var DATA_FILE = "s.json";
// 导出的图片文件路径
var PNG_FILE = "d.png";

// 文件输出路径
//D:\EgretProjects\UITest
var cwd = fl.scriptURI;
cwd = cwd.substring(0, cwd.lastIndexOf("/") + 1);

// 输出路径定义
// 测试期间设置为cwd
var outputBase = "file:///d|/EgretProjects/Test/skin/"; //cwd;
// 模块前缀
var moduleName = "junyou.ttyx";
// 代码输出根目录
var classRoot = "file:///d|/EgretProjects/Test/src/junyou/ttyx/modules/";


// 输出目录
var folder = outputBase + flaname + "/";

// 如果没有文件，创建输出路径
if (!FLfile.exists(folder)) {
    FLfile.createFolder(folder);
}

//扩展
fl.runScript(cwd+"dist/ExtendProto.js");
fl.runScript(cwd+"lib/JSON.polyfil.js");
//装箱
fl.runScript(cwd+"lib/packer.growing.js");
// 主入口
fl.runScript(cwd+"dist/Facade.js");

//输出日志
Log.output(LOG_FILE);