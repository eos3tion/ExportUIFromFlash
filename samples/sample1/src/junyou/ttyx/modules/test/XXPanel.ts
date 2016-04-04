module junyou.ttyx{
import sui = junyou.sui;
/**
* 由导出工具生成
* https://github.com/eos3tion/ExportUIFromFlash
* 生成时间：@createTime@
*/
export class XXPanel extends sui.Panel {

    public dis1:XXPanel_0;

    constructor() {
        super();
    }

    protected init() {
        this._key = "lib";
        this._className = "ui.test.XXPanel";
        
    }

    protected bindComponents() {
        var manager = sui.SuiResManager.getInstance();
        var dis:any;
        this.addChild(manager.createBitmapByData(this._key, [0, [0, -1, 0, 334, 334, 0], 0]));
		dis = new XXPanel_0();
		this.addChild(dis);
		this.dis1 = dis;
    }
}
/**
* 由导出工具生成
* https://github.com/eos3tion/ExportUIFromFlash
* 生成时间：@createTime@
*/
class XXPanel_0 extends egret.Sprite {

	public _key:string;
    public txtLabel: egret.TextField;

    constructor() {
        super();
        this.init();
    }

    protected init() {
        this._key = "lib";
    }

    protected bindComponents() {
        var manager = sui.SuiResManager.getInstance();
        var dis:any;
        dis = manager.createTextFieldByData(this._key, [1, ["txtLabel", 8.5, 28, 156, 17.45, 0], [1, "Times New Roman", 0, "#0066CC", 12, 0, 0, 0]]);
		this.addChild(dis);
		this.txtLabel = dis;
    }
}

}
