module junyou.ttyx{
/**
* 由导出工具生成
* https://github.com/eos3tion/ExportUIFromFlash
* 生成时间：@createTime@
*/
export class XXPanelMediator extends mvc.Mediator {
	
    public $view:XXPanel;

    constructor() {
        super("这里写模块ModuleID");
    }

    protected init() {
        this.view = new XXPanel;

		//这里加事件关注
    }


}
}
