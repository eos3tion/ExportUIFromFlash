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
    /**分页控件 */
    ExportType.PageControll = 4;
    /****九宫图片 */
    ExportType.ScaleBmp = 5;
    ExportType.ArtText = 6;
    ExportType.NumericStepper = 7;
    ExportType.Slider = 8;
    ExportType.Scroll = 9;
    /**进度条**/
    ExportType.ProgressBar = 10;
    ExportType.SlotBg = 11;
    ExportType.ShareBmp = 12;
    ExportType.Slot = 13;
    return ExportType;
}());
