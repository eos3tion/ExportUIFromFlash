/**
 * 用于导入脚本
 * 注册检查器和处理器
 */

Script.runFolderScripts("utils");
Script.runFolderScripts("core");
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

sol.regComChecker(new ShapeNumberParser());

sol.regComChecker(new NumericStepperParser());

sol.regComChecker(new SliderParser());

sol.regComChecker(new ScrollBarParser());
// 加载代码生成器
Script.runScript("generators/JunyouH5Generator");
// 注册生成器
sol.generator = new JunyouH5Generator(sol);


sol.run();

alert("执行完成");