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
    ImageParser.prototype.checkItem = function (libItem, blocks) {
        var bitmaps = this.bitmaps;
        // 遍历timeline
        var timeline = libItem.timeline;
        var layers = timeline.layers;
        var llen = layers.length;
        for (var li = 0; li < llen; li++) {
            var layer = layers[li];
            var ltype = layer.layerType;
            if (ltype === "normal") {
                var flen = layer.frames.length;
                for (var fi = 0; fi < flen; fi++) {
                    var frame = layer.frames[fi];
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
                                var bItem = ele.libraryItem;
                                var bname = bItem.name;
                                var iii = this.bitmaps[bname];
                                if (!iii) {
                                    iii = new ImageInfo();
                                    iii.name = bname;
                                    iii.libItem = bItem;
                                    iii.w = ele.hPixels; // 得到图片高度
                                    iii.h = ele.vPixels; // 得到图片宽度
                                    bitmaps[bname] = iii;
                                    blocks.push(iii);
                                }
                                var aaa = iii.refs;
                                if (!~aaa.indexOf(libItem)) {
                                    aaa.push(libItem);
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
        // 再来20次乱序
        for (var t = 0; t < 20; t++) {
            blocks.sort(sort.random);
            this.doPacking(blocks, "random" + t, packer, results);
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
     * @param {ImageInfo[]} blocks 要装箱的图片数据
     * @param {string} key 排序算法的标识
     * @param {IBlockPacker} packer 装箱算法
     * @param {Result[]} results 结果集合
     */
    ImageParser.prototype.doPacking = function (blocks, key, packer, results) {
        var len = blocks.length;
        var result = {
            key: key,
            blocks: [],
            fit: 0
        };
        packer.fit(blocks);
        var fit = 0, block, n;
        var noFit = false;
        for (n = 0; n < len; n++) {
            block = blocks[n];
            if (block.fit) {
                result.blocks.push(block.clone());
                fit += block.getArea();
            }
            else {
                noFit = true;
                break;
            }
        }
        result.fit = fit;
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
