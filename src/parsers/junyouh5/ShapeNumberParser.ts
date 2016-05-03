/**
 * ShapeNumberParser extends ComWillCheck
 */
class ShapeNumberParser extends ComWillCheck {
    constructor() {
       super(ExportType.ShapeNumber,/^bmd[.](number)/,null,"ShapeNumber");
        this.parseHandler = this.shapeNumberParser;
    }
    
    private shapeNumberParser(checker:ComWillCheck,item:FlashItem,list:any[],solution:Solution){
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];
        
        list[item.$idx]=data;
        
        if(llen!=2)
        {
            Log.throwError("shapenumber必须且只能有2个图层", item.name);
            return;
        }
        for(let i =0;i<llen;i++)
        {
            let layer = layers[i];
            let lname = layer.name;
            if(lname ==="tf")
            {
                let tf:FlashText = layer.frames[0].elements[0];
                data[0] = tf.getTextString();
            }
            else
            {
                let flen = layer.frames.length;
                for(let fi=0;fi<flen;fi++)
                {
                    let frame = layer.frames[fi];
                    data[fi+1]=0;
                    if(frame.startFrame!=fi)
                    {
                        continue;
                    }
                    let elements = frame.elements;
                    let elen = elements.length;
                    for(let ei=0;ei<elen;ei++)
                    {
                        let ele = elements[ei];
                        if(ele && ele.elementType ==="instance" && ele.instanceType === "bitmap")
                        {
                            data[fi+1] = solution.getElementData(ele);
                        }
                    }
                }
            }
        }
    }
}