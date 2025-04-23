'use strict';

const FlowerScript = (function () {
    const strlen_index = Array(256);
    for (const i of [0x00, 0x02, 0x0F, 0x10, 0x12, 0x3D, 0x3F, 0x82, 0x9C, 0xAE, 0xB4]) strlen_index[i] = 1;
    for (const i of [0x22, 0x27, 0x28]) strlen_index[i] = 5;
    for (const i of [0x25, 0x2D]) strlen_index[i] = 6;
    strlen_index[0x1D] = 0;

    const inst_descriptions = {
        0x00: i => i('dialog', 2, { text: i.zero(1).text(1) }),
        0x01: i => i('exit', 2, { _: i.zero(2) }),
        0x02: i => i('jumpScript', 2, { filename: i.zero(1).str(1) }),
        0x04: i => i('varSet', 6, { idx: i.ui(2), val: i.si(4) }),
        0x05: i => i('varAdd', 6, { idx: i.ui(2), val: i.si(4) }),
        0x06: i => i('jumpEqual', 14, { idx: i.zero(2).ui(2), val: i.zero(2).si(4), label: i.label() }),
        0x08: i => i('jumpGtEql', 14, { idx: i.zero(2).ui(2), val: i.zero(2).si(4), label: i.label() }),
        0x09: i => i('jumpLtEql', 14, { idx: i.zero(2).ui(2), val: i.zero(2).si(4), label: i.label() }),
        0x0c: i => i('dialogIdx', 6, { idx: i.zero(2).ui(4) }),
        0x0d: i => i('jump', 6, { label: i.zero(2).label() }),
        0x0e: i => i('waitTime', 6, { duration: i.zero(2).ui(4) }),
        0x0f: i => i('bg_0f', 2, { layer: i.ui(1), filename: i.str(1) }), // BG: not  bg*.bmp
        0x10: i => i('bg_10', 2, { layer: i.ui(1), filename: i.str(1) }), // BG: only bg*.bmp
        0x11: i => i('fgClear', 6, { _: i.zero(6) }),
        0x12: i => i('fg_12', 2, { layer: i.ui(1), filename: i.str(1) }), // load for fade
        0x13: i => i('fgMetrics', 6, { layer: i.ui(1), scale: i.ui(1), xMid: i.si(2), yTop: i.si(2) }),
        0x14: i => i('crossfade', 6, { duration: i.zero(2).ui(4) }),
        0x16: i => i('bgColor', 6, { bgr: i.expect(1, 0).uiArr(1, 3), _: i.zero(1) }),
        0x1b: i => i('selEnd', 2, { idx: i.ui(2) }),
        0x1c: i => i('selBeg', 2, { _: i.zero(2) }),
        0x1d: i => i('selAdd', 6, { text: i.text(1), label: i.zero(1).label() }),
        0x1e: i => i('markEnd_1e', 2, { idx: i.ui(2) }),
        0x21: i => i('markEnding', 2, { idx: i.ui(2) }),
        0x22: i => i('bgmPlay', 6, { loop: i.zero(1).ui(1), name: i.zero(3).str(1) }),
        0x23: i => i('bgmStop', 2, { _: i.zero(2) }),
        0x24: i => i('bgmFadeOut', 6, { duration: i.zero(2).ui(4) }),
        0x25: i => i('bgmFadeIn', 10, { idx: i.ui(1), loop: i.ui(1), duration: i.ui(4), name: i.str(1) }),
        0x27: i => i('voPlay', 6, { name: i.zero(5).str(1) }), // vo can't loop
        0x28: i => i('sePlay', 6, { idx: i.ui(1), loop: i.ui(1), name: i.zero(3).str(1) }),
        0x29: i => i('seStop', 2, { idx: i.ui(1), _: i.zero(1) }),
        0x2a: i => i('voStop', 2, {}),
        0x2c: i => i('seFadeOut', 6, { idx: i.ui(1), duration: i.skip(1).ui(4) }),
        0x2d: i => i('seFadeIn', 10, { idx: i.ui(1), loop: i.ui(1), duration: i.ui(4), name: i.str(1) }),
        0x35: i => i('yuri', 2, { action: i.zero(1).ui(1) }),
        0x36: i => i('op_0x36', 2, { _: i.expect(0, 1) }),
        0x3a: i => i('markGoodEnd', 2, { kind: i.ui(2) }),
        0x3b: i => i('jumpCleared', 6, { idx: i.ui(2), label: i.label() }),
        0x3f: i => i('dialogLog', 2, { text: i.zero(1).text(1) }),
        0x40: i => i('dialogVisible', 2, { visible: i.ui(2) }),
        0x4c: i => i('dialogClear', 2, {}),
        0x4d: i => i('dialogFade', 6, { visible: i.zero(1).ui(1), duration: i.ui(4) }),
        0x50: i => i('effectStart', 10, {
            loop: i.skip(1).ui(1),
            distance: i.ui(4),
            duration: i.ui(4),
        }),
        0x51: i => i('effectStop', 3, {}),
        0x54: i => i('waitClick', 2, { mode: i.ui(2) }),
        0x57: i => i('markTrueEnd', 2, { kind: i.ui(2) }),
        0x5d: i => i('startInvestigate', 2, { idx: i.ui(2) }),
        0x5e: i => i('zeroInvItemTimes', 2, { _: i.zero(2) }),
        0x5f: i => i('jumpInvItemTimesEq', 6, { idx: i.ui(1), cnt: i.ui(1), label: i.label() }),
        0x60: i => i('jumpInvClickedPos', 82, { _: i.skip(2), labels: i.lblArr(20) }),
        0x61: i => i('setInvItemTimes', 2, { idx: i.ui(1), cnt: i.ui(1) }),
        0x72: i => i('animOptA', 18, {
            layer: i.zero(1).ui(1),
            xMid: i.si(2),
            yTop: i.si(2),
            xScale: i.si(2),
            yScale: i.si(2),
            alpha: i.ui(1),
            repeats: i.skip(2).ui(2),
            _: i.skip(3),
        }),
        0x73: i => i('animOptB', 18, {
            layer: i.ui(1),
            mode: i.ui(1),
            xMid: i.si(2),
            yTop: i.si(2),
            xScale: i.si(2),
            yScale: i.si(2),
            alpha: i.ui(1),
            duration: i.zero(3).ui(2),
            _: i.zero(2),
        }),
        0x74: i => i('animRunAll', 2, { _: i.zero(2) }),
        0x75: i => i('animEndSingle', 2, { layer: i.ui(1), _: i.zero(1) }),
        // unskippable flash effect
        // color - 0: white, 1: red, 2: blue, 3: green, no more.
        // times - equal, no repeats, but will flash at least 1 time
        // duration - of a single flash
        0x83: i => i('flash', 6, { color: i.ui(1), times: i.ui(1), duration: i.ui(4) }),
        0x8b: i => i('investigateRet', 2, { _: i.zero(2) }),
        0x9c: i => i('fg_9c', 2, { layer: i.ui(1), filename: i.str(1) }), // load and mark gallery
        0xb2: i => i('video', 6, { kind: i.zero(2).ui(1), _: i.zero(3) }),
        0xb3: i => i('credits', 2, { kind: i.zero(1).ui(1) }),
        0xb4: i => i('avatar', 2, { filename: i.skip(1).str(1) }),
        0xb6: i => i('dialogMode', 2, { mode: i.ui(2) }),
        0xb8: i => i('markChapter', 2, { chapter: i.zero(1).ui(1) }),
        0xba: i => i('op_0xba', 2, {}),
        // 0xbb - 0xbe: gradually change volume, WITH direction (immediate change if already Gt/Lt).
        0xbb: i => i('bgmVolAnimDec', 6, { volume: i.zero(1).ui(1), duration: i.ui(4) }), // BGM
        0xbc: i => i('bgmVolAnimInc', 6, { volume: i.ui(1), duration: i.zero(1).ui(4) }), // BGM
        0xbd: i => i('seVolAnimDec', 6, { volume: i.zero(1).ui(1), duration: i.ui(4) }), // SE(idx>0)
        0xbe: i => i('seVolAnimInc', 6, { volume: i.zero(1).ui(1), duration: i.ui(4) }), // SE(idx>0)
        0xbf: i => i('animRun', 14, { n: i.ui(1), layers: i.uiArr(1, 13) }),
        0xc0: i => i('animEndMulti', 14, { n: i.ui(1), layers: i.uiArr(1, 13) }),
    };

    // https://stackoverflow.com/questions/36871299/how-to-extend-function-with-es6-classes
    class ExFunc extends Function {
        constructor () {
            super('...args', 'return this.__self__.__call__(...args)');
            return this.__self__ = this.bind(this);
        }
    }

    class InstReader extends ExFunc {
        constructor (buffer, string, afterString, noText) {
            super();
            this.offset = 0;
            this.buffer = buffer;
            this.string = string;
            this.afterString = afterString;
            this.opsize = buffer.length;
            this.skipped = [];
            this.labels = [];
            this.noText = noText;
        }
        __call__(cmd, opsize, args) {
            if (this.string !== null) throw new Error(`string not disassembled: ${cmd} ${this.string.length}`);
            if (this.opsize != opsize) throw new Error(`unexpected opsize ${opsize}`);
            if ('_' in args) delete args._;
            const ret = { [cmd]: args };
            if (this.offset < this.buffer.length) this.skipped.push(Array.from(this.buffer.subarray(this.offset)));
            if (this.skipped.length) ret.__skipped = this.skipped;
            if (this.afterString && this.afterString.length) ret.__afterString = this.afterString;
            return ret;
        }
        ui(size) {
            let result = 0;
            for (let i = 0; i < size; i++) result += this.buffer[this.offset++] << (i * 8);
            return result;
        }
        uiArr(size, n) { return Array(n).fill(0).map(_ => this.ui(size)); }
        si(size) {
            const maxi = 2 ** (size * 8);
            const bits = this.ui(size);
            return (bits << 1) & maxi ? bits - maxi : bits;
        }
        siArr(size, n) { return Array(n).fill(0).map(_ => this.si(size)); }
        str(n) { this.offset += n; const s = this.string; this.string = null; return s; }
        text(n) {
            const s = this.str(n);
            if (this.noText) {
                if (s.startsWith('＃'))
                    return '＃' + 'A'.repeat(s.length);
                return 'A'.repeat(s.length);
            }
            return s;
        }
        skip(n) { this.skipped.push(this.unkn(n)); return this; }
        zero(n) { if (!this.unkn(n).every(v => v == 0)) throw new Error('zero() got nonzero'); return this; }
        unkn(n) { return Array.from(this.buffer.subarray(this.offset, this.offset += n)); }
        label() { const l = this.ui(4); this.labels.push(l); return `label_0x${l.toString(16)}`; }
        lblArr(n) { return Array(n).fill(0).map(_ => this.label()); }
        expect(...arr) {
            const got = this.unkn(arr.length);
            for (let i = 0; i < arr.length; i++) if (got[i] != arr[i]) throw new Error(`expect [${arr}] got [${got}]`);
            return this;
        }
    };

    function writeUI(buffer, ui, size) {
        for (let i = 0; i < size; i++) buffer.push(ui & 0xFF), ui >>= 8;
    }

    function writeSI(buffer, si, size) {
        if (si < 0) si += 2 ** (size * 8);
        writeUI(buffer, si, size);
    }

    class InstAsm extends ExFunc {
        constructor (opcode) {
            super();
            this.calls = [];
            this.opsize = 0;
            this.opcode = opcode;
            this.descObj = null;
        }
        ui(size) { return this.calls.push(['ui', size]) - 1; }
        uiArr(size, n) { return this.calls.push(['uiArr', size, n]) - 1; }
        si(size) { return this.calls.push(['si', size]) - 1; }
        siArr(size, n) { return this.calls.push(['siArr', size, n]) - 1; }
        str(n) { return this.calls.push(['str', n]) - 1; }
        text(n) { return this.str(n); }
        skip(n) { this.calls.push(['skip', n]); return this; }
        zero(n) { this.calls.push(['zero', n]); return this; }
        unkn(n) { return this.calls.push(['unkn', n]) - 1; }
        label() { return this.calls.push(['label']) - 1; }
        lblArr(n) { return this.calls.push(['lblArr', n]) - 1; }
        expect(...arr) { this.calls.push(['expect', arr]); return this; }
        __call__(opname, opsize, descObj) {
            this.opsize = opsize;
            this.descObj = descObj;
            return this;
        }
        assemble(instObj, skipped, afterString, buffer, wantLabels, textEncoder) {
            const callArgs = [];
            for (const key in this.descObj) callArgs[this.descObj[key]] = instObj[key];
            let strbytes = null;
            buffer.push(this.opcode, this.opsize + 2);
            this.calls.forEach(([fn, ...args], i) => {
                switch (fn) {
                    case 'ui': writeUI(buffer, callArgs[i], args[0]); break;
                    case 'uiArr': for (let j = 0; j < args[1]; j++) writeUI(buffer, callArgs[i][j], args[0]); break;
                    case 'si': writeSI(buffer, callArgs[i], args[0]); break;
                    case 'siArr': for (let j = 0; j < args[1]; j++) writeSI(buffer, callArgs[i][j], args[0]); break;
                    case 'str':
                        strbytes = Array.from(textEncoder.encode(callArgs[i]));
                        if (afterString) strbytes.push(...afterString);
                        writeUI(buffer, strbytes.length, args[0]);
                        break;
                    case 'skip':
                        buffer.push(...skipped.splice(0, 1)[0]);
                        break;
                    case 'zero':
                        buffer.push(...Array(args[0]).fill(0));
                        break;
                    case 'label':
                        wantLabels.push([buffer.length, callArgs[i]]);
                        buffer.push(0, 0, 0, 0);
                        break;
                    case 'lblArr':
                        for (const labelName of callArgs[i]) {
                            wantLabels.push([buffer.length, labelName]);
                            buffer.push(0, 0, 0, 0);
                        }
                        break;
                    case 'expect':
                        buffer.push(...args[0]);
                        break;
                    default:
                        console.error(fn, args, callArgs[i]);
                }
            });
            if (skipped) skipped.forEach(s => buffer.push(...s));
            if (strbytes) buffer.push(...strbytes);
        }
    }

    const inst_nameToDesc = {};
    const inst_def = new (class InstDef extends ExFunc {
        __call__(cmd, opsize, args) { return [cmd, opsize]; }
        ui() { } uiArr() { } si() { } siArr() { } str() { } text() { } unkn() { } label() { } lblArr() { }
        skip() { return this; }
        zero() { return this; }
        expect() { return this; }
    })();

    const inst_assemblers = {};

    for (const opcode in inst_descriptions) {
        const opname = inst_descriptions[opcode](inst_def)[0];
        inst_nameToDesc[opname] = inst_descriptions[opcode];
        inst_assemblers[opname] = inst_descriptions[opcode](new InstAsm(parseInt(opcode)));
    }

    function disassembleObj(buffer, textDecoder, noText) {
        buffer = Uint8Array.from(buffer);
        let offset = 0;
        const lblSet = {};
        const instList = [];
        while (offset < buffer.length) {
            const opOffs = offset;
            const opcode = buffer[offset++];
            const opsize = buffer[offset++] - 2;
            const opdata = buffer.subarray(offset, offset += opsize);
            const opdesc = inst_descriptions[opcode];
            if (!opdesc) throw new Error(`unknown opcode 0x${opcode.toString(16)} (size ${opsize})`);
            let opstring = null;
            let afterString = null;
            if (strlen_index[opcode] !== undefined) {
                const strlen = opdata[strlen_index[opcode]];
                const strbuf = buffer.subarray(offset, offset += strlen);
                const zIndex = strbuf.indexOf(0);
                const sIndex = zIndex == -1 ? strbuf.length : zIndex;
                opstring = textDecoder.decode(strbuf.subarray(0, sIndex), { stream: false });
                afterString = Array.from(strbuf.subarray(sIndex));
            }
            const instRdr = new InstReader(opdata, opstring, afterString, noText);
            const instObj = opdesc(instRdr);
            for (const lbl of instRdr.labels) lblSet[lbl] = true;
            instList.push([opOffs, instObj]);
        }
        const outLines = [];
        for (const [offset, instObj] of instList) {
            if (lblSet[offset])
                outLines.push(`label_0x${offset.toString(16)}`);
            outLines.push(instObj);
        }
        return outLines;
    }

    function disassemble(buffer, textDecoder, noText) {
        const outLines = disassembleObj(buffer, textDecoder, noText).map(o => JSON.stringify(o));
        return `[\n${outLines.join(',\n')}\n]`;
    }

    function assemble(data, textEncoder) {
        const labels = {};
        const buffer = [];
        const wantLabels = [];
        for (const inst of data) {
            if (typeof inst === 'string') { labels[inst] = buffer.length; continue; }
            let opname = null;
            let instObj = null;
            let skipped = null;
            let afterString = null;
            for (const key in inst) {
                if (key == '__skipped') { skipped = inst[key]; continue; }
                if (key == '__afterString') { afterString = inst[key]; continue; }
                opname = key;
                instObj = inst[key];
            }
            inst_assemblers[opname].assemble(instObj, skipped, afterString, buffer, wantLabels, textEncoder);
        }
        for (const [offset, labelName] of wantLabels) {
            if (!(labelName in labels)) throw new Error(`undefined label ${labelName}`);
            let label = labels[labelName];
            for (let i = 0; i < 4; i++) buffer[offset + i] = label & 0xFF, label >>= 8;
        }
        return Uint8Array.from(buffer);
    }
    
    return { disassembleObj, disassemble, assemble };
})();

if (typeof module !== 'undefined') module.exports = FlowerScript;
