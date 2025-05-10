'use strict';

const fs = require('fs');
const cp932 = require('iconv-cp932');
const flowerscript = require('./flowerscript.js');

const filelist = [
    '03a_00001.s',
    '03a_01000.s',
    '03a_01100.s',
    '03a_01200.s',
    '03a_01300.s',
    '03a_01400.s',
    '03a_01500.s',
    '03a_01600.s',
    '03a_01700.s',
    '03a_01800.s',
    '03a_01999.s',
    '03a_02000.s',
    '03a_02100.s',
    '03a_02200.s',
    '03a_02300.s',
    '03a_02400.s',
    '03a_02500.s',
    '03a_02600.s',
    '03a_02700.s',
    '03a_02800.s',
    '03a_02801.s',
    '03a_02900.s',
    '03a_02999.s',
    '03a_03000.s',
    '03a_03100.s',
    '03a_03200.s',
    '03a_03300.s',
    '03a_03400.s',
    '03a_03500.s',
    '03a_03600.s',
    '03a_03700.s',
    '03a_03800.s',
    '03a_03900.s',
    '03a_03999.s',
    '03a_04000.s',
    '03a_04100.s',
    '03a_04200.s',
    '03a_04300.s',
    '03a_04400.s',
    '03a_04500.s',
    '03a_04600.s',
    '03a_04700.s',
    '03a_04701.s',
    '03a_04800.s',
    '03a_04900.s',
    '03a_04999.s',
    '03a_05000.s',
    '03a_05100.s',
    '03a_05200.s',
    '03a_05300.s',
    '03a_05400.s',
    '03a_05500.s',
    '03a_05600.s',
    '03a_05700.s',
    '03a_05800.s',
    '03a_05801.s',
    '03a_05802.s',
    '03a_05900.s',
    '03a_05999.s',
    '03a_06000.s',
    '03a_06100.s',
    '03a_06200.s',
    '03a_06300.s',
    '03a_06500.s',
    '03a_06510.s',
    '03a_06600.s',
    '03a_06700.s',
    '03a_07000.s',
    '03a_07999.s',
    '03a_08000.s',
    'start.s',
];

process.stdout.write('const game_script = {\n');
process.stdout.write(filelist.map(name => {
    const bytes = fs.readFileSync(`scripts_automne/${name}`);
    const disasm = flowerscript.disassemble(bytes, cp932, false);
    const reasm = flowerscript.assemble(JSON.parse(disasm), cp932);
    console.assert(bytes.compare(reasm) == 0);
    return `"${name}": ${disasm}`;
}).join(',\n'));
process.stdout.write('};');
