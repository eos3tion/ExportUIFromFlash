class MovieClipParser extends ComWillCheck {
    constructor() {
        super(ExportType.MovieClip, /^ui[.](mc)[.]/, null, "MovieClip");
    }

    doParser(item: FlashItem, solution: Solution) {
        let timeline = item.timeline;
        let flen = timeline.frameCount;
        let layers = timeline.layers;
        let name = item.name;
        let keyFrames = [] as number[];

        //-----------------------------------------预处理----------------------------------------------
        /**
         * 元素的字典
         * key      {string}   名字
         * value   {FlashElement} 元素
         */
        let elesByName = {} as { [index: string]: FlashElement };
        let mcDataByName = {} as { [index: string]: MCData };
        let mcIdx = 0;
        for (let fi = 0; fi < flen; fi++) {
            for (let i = layers.length - 1; i >= 0; i--) {//从下往上遍历
                let layer = layers[i];
                let frame = layer.frames[fi];
                if (frame) {
                    if (frame.startFrame == fi) {//只处理关键帧
                        keyFrames.pushOnce(fi);
                        //遍历元素，检查元素是否是之前就有的
                        let elements = frame.elements;
                        let elen = elements.length;
                        for (let ei = 0; ei < elen; ei++) {
                            let ele = elements[ei];
                            let ename = ele.name;
                            if (!ename) {//如果没有名字的，暂时不处理，后续到关键帧，当做新对象进行创建
                                ename = getEName(frame, i, ei);
                            }
                            let oEle = elesByName[ename];
                            if (oEle) {//有原始的元素
                                let etype = ele.elementType;
                                let oetype = oEle.elementType;
                                if (etype != oetype || ele.libraryItem != oEle.libraryItem) {
                                    Log.throwError(`同一个元件中，子元件使用了相同的名字[${ename}]，但是没有使用相同的实例`);
                                }
                            } else {
                                //第一次出现，创建第一次出现的数据
                                mcDataByName[ename] = { first: fi, mcIdx: mcIdx++, data: solution.getEleBaseData(ele) };
                                elesByName[ename] = ele;
                            }
                        }
                    }
                }
            }
        }

        let framesData = {} as { [index: number]: DepthEleData[] };
        //开始遍历关键帧
        let keyflen = keyFrames.length;
        let llen = layers.length - 1;
        for (let i = 0; i < keyflen; i++) {
            let fi = keyFrames[i];
            let frameData = framesData[fi] = [] as DepthEleData[];
            for (let i = llen, pi = 0; i >= 0; i-- , pi++) {//从下往上遍历
                let layer = layers[i];
                let frame = layer.frames[fi];
                if (frame) {
                    let elements = frame.elements;
                    let elen = elements.length;
                    for (let ei = 0; ei < elen; ei++) {
                        let ele = elements[ei];
                        let ename = ele.name;
                        let eData = [] as MCEleRef | number;
                        let flag = true;
                        if (!ename) {
                            ename = getEName(frame, i, ei);
                            if (!mcDataByName[ename]) {
                                eData[0] = -1;
                                eData[1] = solution.getElementData(ele);
                                flag = false;
                            }
                        }
                        if (flag) {
                            let mcData = mcDataByName[ename];
                            if (!mcData) {
                                Log.throwError(`mc中第${fi}帧原件有名字[${ename}]，但是没有数据`)
                            }
                            //检查原始数据是否和当前数据一致
                            let eleBaseData = solution.getEleBaseData(ele);
                            if (checkArray(eleBaseData, mcData.data)) {
                                //检查是否为文本框，如果是文本框，提取文本框属性
                                if (ele.elementType == ElementType.Text) {
                                    let textData = solution.getTextData(ele as FlashText);
                                    let oEle = elesByName[ename];
                                    let oTextData = solution.getTextData(oEle as FlashText);
                                    if (checkArray(textData, oTextData)) {
                                        eData = mcData.mcIdx;
                                    } else {
                                        eData[0] = mcData.mcIdx;
                                        eData[1] = eleBaseData;
                                        eData[2] = textData;
                                    }
                                } else {
                                    eData = mcData.mcIdx;
                                }
                            } else {
                                eData[0] = mcData.mcIdx;
                                eData[1] = eleBaseData;
                            }
                        }
                        frameData.push(new DepthEleData(pi, ele.depth, eData));
                    }
                }
            }
            //重新排序
            frameData.sort((a, b) => a.idx - b.idx);
            frameData.forEach((item, idx) => {
                frameData[idx] = item.data;
            });
        }
        let data = [];
        //得到总数据和关键帧数据
        let eles = data[0] = [];
        for (let name in elesByName) {
            let ele = elesByName[name];
            let mcData = mcDataByName[name];
            let data = solution.getElementData(ele);
            eles[mcData.mcIdx] = data;
        }
        //如果没数据，则使用0进行填充
        if (eles.length == 0) {
            data[0] = 0;
        }

        let fds = data[1] = [];
        let lastFrameDatas: { 0: number, 1: any[] };
        for (let i = 0; i < flen; i++) {
            let frameData = framesData[i];
            if (frameData) {
                lastFrameDatas = [1, frameData];
                fds.push(lastFrameDatas);
            } else {
                if (lastFrameDatas) {
                    lastFrameDatas[0]++;
                }
            }
        }
        return data;
    }
}

/**
 * 对没有名字的实例进行命名
 * 
 * @param {FlashFrame} frame
 * @param {number} layerIndex 层索引
 * @param {number} childIndex 层级上的子对象层级
 * @returns 
 */
function getEName(frame: FlashFrame, layerIndex: number, childIndex: number) {
    return `$noname_${frame.startFrame}_${layerIndex}_${childIndex}`;
}

function checkArray(a: any[], b: any[]) {
    let alen = a.length;
    let blen = b.length;
    if (alen != blen) {
        return false;
    }
    for (let i = 0; i < alen; i++) {
        let aD = a[i];
        let bD = b[i];
        if (aD instanceof Array && bD instanceof Array) {
            if (!checkArray(aD, bD)) {
                return false;
            }
        } else {
            if (aD !== bD) {
                return false;
            }
        }
    }
    return true;
}


interface MCData {
    /**
     * 第一次出现的帧数
     * 
     * @type {number}
     * @memberof FlashElement
     */
    first: number;

    /**
     * mc的索引
     * 
     * @type {number}
     * @memberof FlashElement
     */
    mcIdx: number;

    /**
     * 初始数据
     * 
     * @type {BaseData}
     * @memberof MDData
     */
    data: BaseData;
}

interface MCEleRef extends Array<any> {
    /**
     * mc的索引，
     * 如果是-1，则新创建
     * 
     * @type {number}
     * @memberof MCEleRef
     */
    0: number;

    /**
     * 变更的数据 或者完整的组件数据
     * 
     * @type {(BaseData | ComponentData)}
     * @memberof MCEleRef
     */
    1?: BaseData | ComponentData;

    /**
     * 文本数据
     * 
     * @type {TextData}
     * @memberof MCEleRef
     */
    2?: TextData;
}