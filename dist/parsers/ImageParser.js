/**
 * 对图片进行处理
 *
 * @class ImageParser
 */
var ImageParser = (function () {
    function ImageParser() {
        this.bitmaps = {};
    }
    /**
     * 检查库中的Item
     *
     * @param {FlashItem} libItem 库中的Item
     * @param {ImageInfo[]} blocks 用于传出的ImageInfo对象
     */
    ImageParser.prototype.checkItem = function (libItem, blocks, solution) {
        if (libItem.linkageImportForRS) {
            return;
        }
        var bitmaps = this.bitmaps;
        // 遍历timeline
        var timeline = libItem.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        if (llen == 2) {
            // BitmapSlice9.jsfl处理过的图片，做特殊处理
            var _a = solution.getScaleBitmapLayer(layers, libItem), layer = _a.layer, error = _a.error;
            if (layer) {
                var flag = true;
                var frames_1 = layer.frames;
                if (frames_1.length > 1) {
                    Log.throwError("BitmapSlice9.jsfl处理的九宫图元件引导帧数多余一帧", libItem.name);
                    return;
                }
                var elements = frames_1[0].elements;
                if (elements.length > 1) {
                    Log.throwError("BitmapSlice9.jsfl处理的九宫图元件引导层只能引用一张位图", libItem.name);
                    return;
                }
                var ele = elements[0];
                solution.addImageToLib(ele, libItem);
                return;
            }
        }
        for (var li = 0; li < llen; li++) {
            var layer = layers[li];
            var ltype = layer.layerType;
            if (ltype === LayerType.Normal) {
                var frames_2 = layer.frames;
                var flen = frames_2.length;
                for (var fi = 0; fi < flen; fi++) {
                    var frame = frames_2[fi];
                    if (frame.startFrame !== fi) {
                        continue;
                    }
                    var elements = frame.elements;
                    var elen = elements.length;
                    for (var ei = 0; ei < elen; ei++) {
                        var ele = elements[ei];
                        var elementType = ele.elementType;
                        if (elementType === "instance") {
                            var instanceType = ele.instanceType;
                            if (instanceType === "bitmap") {
                                solution.addImageToLib(ele, libItem);
                            }
                            else if (instanceType === "symbol") {
                                var bItem = ele.libraryItem;
                                if (!bItem.linkageClassName) {
                                    this.checkItem(bItem, blocks, solution);
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    /**
     * 解析Image，获取图片数据和装箱后的图片文件
     *
     * @param {IBlockPacker} packer 装箱器
     * @param {ImageInfo[]} blocks 带装箱的图片
     * @return 对应的数据 ImageInfo.prototype.toExport()的数据
     * @see ImageInfo.prototype.toExport
     */
    ImageParser.prototype.parse = function (packer, blocks) {
        var results = [];
        var len = blocks.length;
        if (!len) {
            return undefined;
        }
        if (typeof packer.setWidth == "function") {
            //得到图片的最大宽度
            var maxWidth = 0;
            var total = 0;
            for (var i = 0; i < len; i++) {
                var block = blocks[i];
                var w = block.w;
                total += w;
                if (w > maxWidth) {
                    maxWidth = w;
                }
            }
            //从最宽的一个 到总宽度的 进行遍历设置
            for (var w = maxWidth; w <= total; w++) {
                packer.setWidth(w);
                Log.trace("正在使用宽度：", w);
                this.doPacking(blocks, "setWidth:" + w, packer, results);
            }
        }
        else {
            // 先打乱顺序
            for (var ki = 0; ki < len; ki++) {
                var nb = this.idxHandler(ki, blocks);
                this.doPacking(nb, "areaI" + ki, packer, results);
            }
            // 使用基础排序尝试
            var baseSorts = sort.baseSorts, bi = 0, blen = baseSorts.length;
            for (; bi < blen; bi++) {
                var skey = baseSorts[bi];
                var sHandler = sort[skey];
                blocks.sort(sHandler);
                this.doPacking(blocks, skey, packer, results);
            }
            // 再来100次乱序
            for (var t = 0; t < 100; t++) {
                blocks.sort(sort.random);
                this.doPacking(blocks, "random" + t, packer, results);
            }
        }
        results.sort(function (a, b) {
            return a.fit - b.fit;
        });
        // 得到面积最小的结果
        var result = results[0];
        return this.exportImage(result.blocks);
    };
    /**
     * 将快信息导出成图片
     */
    ImageParser.prototype.exportImage = function (result) {
        var bitmaps = this.bitmaps;
        var imgDatas = [];
        var tname = "$$$temp";
        if (lib.itemExists(tname)) {
            lib.deleteItem(tname);
        }
        // 创建一个新的原件
        lib.addNewItem("movie clip", tname);
        lib.editItem(tname);
        // 将info中数据放入这个
        for (var k = 0, len = result.length; k < len; k++) {
            var block = result[k];
            imgDatas[k] = block.toExport();
            bitmaps[block.name] = block;
            block.idx = k;
            var fit = block.fit;
            if (fit) {
                var hw = block.w * 0.5;
                var hh = block.h * 0.5;
                var pos = {
                    x: fit.x + hw,
                    y: fit.y + hh
                };
                while (!lib.addItemToDocument(pos, block.name))
                    ;
                dom.mouseClick(pos, false, true);
                dom.setElementProperty("x", fit.x);
                dom.setElementProperty("y", fit.y);
            }
            else {
                Log.trace("noFit", JSON.stringify(block));
            }
        }
        /********将图片拼合，并导出********/
        dom.selectAll();
        dom.convertSelectionToBitmap();
        var ele = dom.selection[0];
        if (!ele) {
            Log.throwError("没有成功拼合图片");
        }
        var bitmap = ele.libraryItem;
        // 导出的文件路径
        var exname = folder + PNG_FILE;
        bitmap.exportToFile(exname);
        // 删除临时文件
        // 图片导出之前，删除操作会失败，所以加了while
        while (!lib.deleteItem(bitmap.name)) { }
        while (!lib.deleteItem(tname)) { }
        FLExternal.pngquant(exname);
        // 导出图片数据
        return imgDatas;
    };
    /**
     * 按指定索引，重新排列顺序
     * [0,1,2,3,4,5,6,7]
     * 如果索引使用3，则输出[3,4,5,6,7,0,1,2]
     * @private
     * @param {number}      idx          指定的索引
     * @param {ImageInfo[]} blocks       图片集合
     * @returns 处理后的数组
     */
    ImageParser.prototype.idxHandler = function (idx, blocks) {
        var len = blocks.length;
        var nb = [];
        var pi = 0;
        for (var ii = idx; ii < len; ii++) {
            nb[pi++] = blocks[ii];
        }
        for (var ni = 0; ni < idx; ni++) {
            nb[pi++] = blocks[ni];
        }
        return nb;
    };
    /**
     * 进行装箱
     *
     * @param {ImageInfo[]} inputs 要装箱的图片数据
     * @param {string} key 排序算法的标识
     * @param {IBlockPacker} packer 装箱算法
     * @param {Result[]} results 结果集合
     */
    ImageParser.prototype.doPacking = function (inputs, key, packer, results) {
        var len = inputs.length;
        var blocks = packer.fit(inputs);
        if (!blocks) {
            return;
        }
        if (len != blocks.length) {
            Log.trace("装箱时，有Block没被装箱，请检查！", len, blocks.length);
            return;
        }
        Log.trace("开始添加结果集");
        var result = {
            key: key,
            blocks: [],
            fit: 0
        };
        var block, n;
        var noFit = false;
        var width = 0;
        var height = 0;
        for (n = 0; n < len; n++) {
            block = blocks[n];
            if (block.fit) {
                result.blocks.push(block.clone());
                //fit += block.getArea();
                var right = block.fit.x + block.w;
                if (right > width) {
                    width = right;
                }
                var bottom = block.fit.y + block.h;
                if (bottom > height) {
                    height = bottom;
                }
            }
            else {
                noFit = true;
                break;
            }
        }
        result.fit = width * height;
        if (noFit) {
            Log.trace(result.key + "noFit");
        }
        else {
            results.push(result);
            Log.trace(result.key + ":" + result.fit);
        }
    };
    return ImageParser;
}());
var sort = {
    /**
     * 基础的排序标识
     */
    baseSorts: ["a", "area", "h", "height", "max", "maxside", "min", "w", "width"],
    random: function (a, b) {
        return Math.random() - 0.5;
    },
    w: function (a, b) {
        return b.w - a.w;
    },
    h: function (a, b) {
        return b.h - a.h;
    },
    a: function (a, b) {
        return b.getArea() - a.getArea();
    },
    max: function (a, b) {
        return Math.max(b.w, b.h) - Math.max(a.w, a.h);
    },
    min: function (a, b) {
        return Math.min(b.w, b.h) - Math.min(a.w, a.h);
    },
    height: function (a, b) {
        return sort.msort(a, b, ["h", "w"]);
    },
    width: function (a, b) {
        return sort.msort(a, b, ["w", "h"]);
    },
    area: function (a, b) {
        return sort.msort(a, b, ["a", "h", "w"]);
    },
    maxside: function (a, b) {
        return sort.msort(a, b, ["max", "min", "h", "w"]);
    },
    msort: function (a, b, criteria) {
        var diff, n;
        for (n = 0; n < criteria.length; n++) {
            diff = sort[criteria[n]](a, b);
            if (diff !== 0)
                return diff;
        }
        return 0;
    }
};
;
