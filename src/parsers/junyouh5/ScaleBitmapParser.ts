class ScaleBitmapParser extends ComWillCheck {
    constructor() {
        super(ExportType.ScaleBmp, /^bmd[.](scale9)[.]/, null, "egret.Bitmap");
    }

    doParser(item: FlashItem, solution: Solution) {
        let data = solution.getScaleBitmapData(item);
        return data;
    }
}