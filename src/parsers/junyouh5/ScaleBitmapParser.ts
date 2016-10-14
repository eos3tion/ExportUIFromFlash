class ScaleBitmapParser extends ComWillCheck {
    constructor() {
        super(ExportType.ScaleBmp, /^bmd[.](scale9)/, null, "sui.ScaleBitmap");
        this.parseHandler = this.scaleBitmapParser;
    }

    private scaleBitmapParser(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        list[item.$idx] = solution.getScaleBitmapData(item);
    }
}