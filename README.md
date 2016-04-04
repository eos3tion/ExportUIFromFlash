# ExportUIFromFlash 
项目类型为jsfl项目，开发工具为Visual Studio Code，和Adobe Animate CC  

## 项目目的
按照junyougame原有通过flash开发UI的工作流，  
导出从Adobe Flash(Animate)中制作的控件和数据给其他非AS3项目使用  

# 文件结构
┌Main.jsfl 为项目入口，配置项目各种常量路径  
├src\ 使用TypeScript编写的脚本  
│   ├Facade.ts 对项目使用的控件Parser，面板的代码生成器进行绑定  
│   ├ExtendProto.ts 扩展ECMA3中的基本数据类型  
│   ├Solution.ts 项目的主体代码  
│   ├core\ 用于存放主要的数据类型  
│   ├generators\ 用于放代码生成器的代码  
│   ├parsers\ 用于放控件的处理脚本  
│   └utils\ 用于放项目用到的工具类  
├dist\ 使用tsc的发布路径，目录结构同src，代码为生成后的js代码  
├templates\ 用于放代码生成器的代码模板  
└typings\tsd.d.ts 中加了项目中用的脚本定义  
