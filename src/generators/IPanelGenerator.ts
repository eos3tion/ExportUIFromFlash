interface IPanelGenerator {

  /**
   * 生成面板代码
   * 
   * @param {string} className 面板的类名字
   * @param {ComponentData} data data的结构如下
   * data[0] ExportType       导出类型
     data[1] BaseData         基础数据
     data[2] ComponentData    组件数据
     data[3] lib              组件对应的库
     @param {SizeData} sizes size大小
   */
  generateOnePanel(className: string, data: ComponentData, sizes: SizeData);
}