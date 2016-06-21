class NumericStepperParser extends ComWillCheck{
    constructor(){
        super(ExportType.NumericStepper,/^ui[.](numstep)/,null,"NumericStepper");
        this.parseHandler = this.NumericStepperParser;
    }
    
    private NumericStepperParser(checker:ComWillCheck,item:FlashItem,list:any[],solution:Solution){
        let timeline = item.timeline;
        let layers = timeline.layers;
        let llen = layers.length;
        let data = [];
        
        list[item.$idx] = data;
        
        let layer = layers[0];
        
        let frame = layer.frames[0];
        
        let elements = frame.elements;
        let elen = elements.length;
        
        for(let i=0;i<elen;i++){
            let ele = elements[i];
            data[i] = solution.getElementData(ele);
        }
    }
}