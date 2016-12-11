class ArtWordParser extends ComWillCheck {
    constructor() {
        super(ExportType.ArtText, /^bmd[.](artword)/, null, "sui.ArtWord");
        this.parseHandler = this.parse;
    }

    private parse(checker: ComWillCheck, item: FlashItem, list: any[], solution: Solution) {
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];

        list[item.$idx] = data;

        if (llen > 1) {
            Log.throwError("ArtText必须且只能有1个图层", item.name);
            return;
        }

        let layer = layers[0];
        let lname = layer.name;
        let flen = layer.frames.length;
        let frame = layer.frames[0];
        let elements = frame.elements;
        let elen = elements.length;
        for (let ei = 0; ei < elen; ei++) {
            let ele = elements[ei];
            let tempName: string;
            if (ele && ele.elementType === "instance" && ele.instanceType === "bitmap") {
                let dat = solution.getElementData(ele);
                //由于此类型dat[0]必为 0 (ExportType.Image) ，所以将dat的0号位用来记录文件名
                data[ei] = dat;
                tempName = ele.libraryItem.name;
                tempName = tempName.substr(tempName.lastIndexOf("/") + 1);
                tempName = tempName.split(".")[0];
                let itn = +tempName;
                if (<any>tempName == itn) {
                    dat[0] = itn;//数值类型，优化，减少字符串输出
                } else {
                    dat[0] = tempName;
                }
            }
        }
    }
}