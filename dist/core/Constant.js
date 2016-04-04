/**
 * 导出类型标识
 */
var ExportType = (function () {
    function ExportType() {
    }
    /**图片**/
    ExportType.Image = 0;
    /**文本框*/
    ExportType.Text = 1;
    /**复合容器**/
    ExportType.Container = 2;
    /**按钮 */
    ExportType.Button = 3;
    return ExportType;
}());
