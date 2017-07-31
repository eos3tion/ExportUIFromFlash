const enum Const {
    $2_16 = 2 << 16
}
class BinPacker implements IBlockPacker {

    selfSorting: boolean = true;

    /**
     * 
     * block间的间隔
     * @type {number}
     */
    public gap = 0;

    private _pw: number;

    private _tmp1: IBlock[] = [];
    private _tmp2: IBlock[] = [];
    setWidth(width: number) {
        this._pw = width;
    }
    fit(blocks: IBlock[]) {
        const total = blocks.length;
        if (total == 1) {
            let block = blocks[0];
            block.fit = { x: 0, y: 0 };
            return blocks;
        }
        let to_package = this._tmp1;
        /**
         * 剩余要处理的块
         */
        let restBlocks: IBlock[] = this._tmp2;
        for (let i = 0; i < total; i++) {
            to_package[i] = blocks[i];
        }
        const sortX = (a: IBlock, b: IBlock) => a.fit.x - b.fit.x;
        to_package.sort((a, b) => (b.h * Const.$2_16 | b.w) - (a.h * Const.$2_16 | a.w));
        /**
         * 行号
         */
        let row = 0;
        /**
         * 单行正向偏移
         */
        let vx = 0;
        /**
         * 单行逆向偏移
         */
        let vwx = 0;
        /**
         * 一行数据
         */
        let rows: IBlock[][] = [];
        const pw = this._pw;
        const gap = this.gap;
        let testCount = 0;
        let len = total;
        let j = 0;
        while (true) {
            for (let i = 0; i < len; i++) {
                let bs = to_package[i];
                let fit: $BinPackageFit;
                if (!(row & 1)) {//偶数行
                    let will = vx + bs.w;
                    if (will <= pw) {
                        fit = new $BinPackageFit();
                        fit.setX(vx);
                        vx = will + gap;
                        if (row == 0) {
                            fit.y = 0;
                        }
                    }

                } else { //奇数行
                    let will = pw - vwx - bs.w;
                    if (will => 0) {
                        fit = new $BinPackageFit();
                        fit.setX(will);
                        vwx += bs.w + gap;
                    }
                }
                bs.fit = fit;
                if (fit) {
                    if (row > 0) {
                        let lastRow = rows[row - 1];
                        if (!lastRow) {
                            continue;
                        }
                        lastRow.sort(sortX);
                        let res = this.findMinY(lastRow, bs);
                        if (!res) {
                            // 没有得到结果先放到尾端    
                            restBlocks[j++] = bs;
                            continue;
                        }
                        fit.y = gap + res;
                    }
                    let rowData = rows[row];
                    if (!rowData) {
                        rows[row] = rowData = []
                    }
                    rowData.push(bs);
                } else {
                    restBlocks[j++] = bs;
                }
            }
            if (j == 0) {
                break;
            }
            //继续装箱没有装箱的结果
            let tmp = to_package;
            to_package = restBlocks;
            restBlocks = tmp;
            len = j;
            j = 0;
            vx = 0;
            vwx = 0;
            if (rows.length > row) {//最后一行
                //检查前一行数据，将跨行的视图，加入到新行
                this.checkRows(rows, row);
            }
            if (++row > total) { //产生的行数超过总数量
                return;
            }
        }

        return blocks;
    }

    /**
     * 检查前一行数据，将跨行的视图，加入到新行
     * @param rows
     * @param row
     *
     */
    private checkRows(rows: IBlock[][], row: number) {
        if (row > 0) {
            let last = rows[row - 1];
            let current = rows[row];
            let minBottom = Infinity;
            /**
             * 最小x坐标的Block
             */
            let minXBlock: IBlock;
            let minX = Infinity;
            /**
             *        ┌───┐
             *   ┌────┤   ├────┐    l1,l2,l3 为 last 即上一行
             *   │ l1 │l2 │ l3 │
             *   ├──┬─┤   │    │
             *   │c1├─┴─┬─┤    │
             *   │  │c2 │ │    │    c1 c2 为当前行
             *   │  ├───┘ │    │
             *   └──┘←┐   │    │
             *        │   └────┘    l3 的底部 比当前行c1 c2最大的底部还要高，所以需要将 l3加入到当前行，以便后续比较
             *        └ maxBottom
             * 
             *   4 可以直接放入
             */
            for (let i = 0; i < current.length; i++) {
                let bin = current[i];
                let fit = bin.fit;
                let bottom = fit.y + bin.h;
                if (fit.x < minX) {
                    minX = fit.x;
                    minXBlock = bin;
                }
                if (bottom < minBottom) {
                    minBottom = bottom;
                }
            }
            for (let i = 0; i < last.length; i++) {
                let bin = last[i];
                let fit = bin.fit;
                let bottom = fit.y + bin.h;
                if (bottom >= minBottom) {
                    current.push(bin);
                    if (fit.x < minX) {
                        minX = fit.x;
                        minXBlock = bin;
                    }
                }
            }
            if (minXBlock) {
                //设置行起始坐标
                (<$BinPackageFit>minXBlock.fit).vx = 0;
            }
        }
    }

    private findMinY(arr: IBlock[], bs: IBlock) {
        let rs = 0;
        let assume = 0;
        let maxY = 0;
        let fit = bs.fit as $BinPackageFit;
        for (let i = 0; i < arr.length; i++) {
            let t = arr[i];
            let tfit = t.fit as $BinPackageFit;
            let tBottom = tfit.y + t.h;
            if (maxY == 0) {// 起始点
                let tRight = tfit.x + t.w;
                if (fit.x >= tfit.vx && fit.vx <= tRight) {

                    if (fit.x + bs.w <= tRight) {
                        /**
                        *        ┌───┐
                        *   ┌────┤   ├────┐    1,2,3 为上一行Block
                        *   │ 1 t│ 2 │ 3  │
                        *   ├──┬─┤   │    │    
                        *   │bs│ └───┤    │
                        *   │  │     └────┘
                        *   └──┘ ↑
                        *        tRight
                        *      ↑
                        *    fit.x+bs.w
                        * 
                        *   4 可以直接放入
                        */

                        rs = tBottom;
                        break;
                    } else {

                        /**
                         *        ┌───┐
                         *   ┌────┤   ├────┐
                         *   │  1 │ 2 │ 3  │
                         *   └────┤   │    │    上一行Block
                         *        └───┤    │
                         *        ↑   └────┘
                         *       tRight
                         *   ┌─────┐
                         *   │  4  │
                         *   └─────┘
                         *         ↑
                         *        fit.x + bs.w
                         */
                        if (maxY < tBottom) {
                            maxY = tBottom;
                        }
                        assume = tRight;
                    }
                }
            } else {
                if (maxY < tBottom) {
                    maxY = tBottom;
                }
                /**
                 *        ┌───┐
                 *   ┌────┤   ├────┐
                 *   │  1 │ 2 │ 3  │
                 *   └────┤ t │    │    上一行Block
                 *        └───┤    │
                 *        ↑   └────┘
                 *    assume  ↑
                 *    ┌─────┐ tRight
                 *    │ bs  │
                 *    └─────┘
                 *          ↑
                 *        fit.x + bs.w
                 */
                if (fit.vx + bs.w <= assume + t.w) {
                    rs = maxY;
                    break;
                } else {
                    assume += t.w;
                }
            }
        }

        if (rs == 0) {
            rs = maxY;
        }
        if (rs > 0) {
            return rs;
        }
    }
}


class $BinPackageFit {
    /**
     * 如果有高度会跨行，
     * 跨起始坐标x;
     * 
     * @type {number}
     */
    public vx: number;
    public y: number;

    public x: number;
    setX(v: number) {
        this.x = v;
        this.vx = v;
    }

}