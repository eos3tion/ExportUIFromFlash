class ShareBitmapParser extends ComWillCheck{
    constructor(){
        super(ExportType.ShareBmp,/^bmd[.](share)/,null,"ShareBitmap");
        this.parseHandler = this.shareParser;
    }

    private shareParser(checker:ComWillCheck,item:FlashItem,list:any[],solution:Solution){
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];
        list[item.$idx] = data;
            if(layers.length>2)
            {
                Log.throwError("sharebmp只能有一个图层", item.name);
                return;
            }
            let layer = null;
            layer = layers[0];
            if (layer.frames.length>1) {
               Log.throwError("sharebmp只能为1帧", item.name);
               return;
            }
            let elements = layer.frames[0].elements;
            if(elements.length>1)
            {
                 Log.throwError("sharebmp只能引用一张位图", item.name);
                 return;
            }
            let ele = elements[0];
            if(ele.elementType ==="instance" && ele.instanceType ==="bitmap")
            {
                data[0] = solution.getElementData(ele);              
            }
    }
}