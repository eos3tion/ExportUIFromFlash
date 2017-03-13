/**
 * 导出类型标识
 */
const enum ExportType {
    /*=======================基础控件======================= */
    /**图片**/
    Image = 0,
    /**文本框*/
    Text = 1,
    /**复合容器**/
    Container = 2,
    /****九宫图片 */
    ScaleBmp = 5,
    /**
     * 非可视对象
     * 
     * @static
     * 
     * @memberOf ExportType
     */
    Rectangle = 14,

    /**
     * 空容器，可带大小
     */
    Sprite = 16,

    /**
     * 字库
     */
    ArtWord = 15,

    /**
     * 外部图片加载器
     */
    ImageLoader = 17,

    /*=======================复杂控件======================= */
    /**按钮 */
    Button = 3,

    /**分页控件 */

    PageControll = 4,

    ArtText = 6,

    NumericStepper = 7,

    Slider = 8,

    Scroll = 9,
    /**进度条**/
    ProgressBar = 10,

    SlotBg = 11,

    ShareBmp = 12,

    Slot = 13,


}

const enum Const {
    /**
     * flash最大尺寸限制
     */
    MaxSize = 3999
}

const ItemType = {
    Undefined: "undefined",
    Component: "component",
    MovieClip: "movie clip",
    Graphic: "graphic",
    Button: "button",
    Folder: "folder",
    Font: "font",
    Sound: "sound",
    Bitmap: "bitmap",
    CompiledClip: "compiled clip",
    Screen: "screen",
    Video: "video"
}

/**
 * 图层类型
 */
const LayerType = {
    /**
     * 普通层
     */
    Normal: "normal",
    /**
     * 引导层
     */
    Guide: "guide",
    /**
     * 被引导层
     */
    Guided: "guided",
    /**
     * 遮罩层
     */
    Mask: "mask",
    /**
     * 被遮罩的图层
     */
    Masked: "masked",
    /**
     * 文件夹
     */
    Folder: "folder"
}

const InstanceType = {
    Symbol: "symbol",
    Bitmap: "bitmap",
    EmbeddedVideo: "embedded video",
    LinkedVideo: "linked video",
    Video: "video",
    CompiledClip: "compiled clip"
}

const ElementType = {
    /**
     * Shape
     */
    Shape: "shape",
    /**
     * 文本框
     */
    Text: "text",
    /**
     * 实例
     */
    Instance: "instance",
    /**
     * 可扩展工具创建的对象
     */
    ShapeObj: "shapeObj"
}