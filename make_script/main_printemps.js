'use strict';

const fs = require('fs');
const cp932 = require('iconv-cp932');
const flowerscript = require('./flowerscript.js');

const filelist = [
    '01a_00001.s',
    '01a_01000.s',
    '01a_01100.s',
    '01a_01200.s',
    '01a_01300.s',
    '01a_01400.s',
    '01a_01410.s',
    '01a_01500.s',
    '01a_01510.s',
    '01a_01600.s',
    '01a_01700.s',
    '01a_01800.s',
    '01a_02000.s',
    '01a_02100.s',
    '01a_02200.s',
    '01a_02300.s',
    '01a_02400.s',
    '01a_02410.s',
    '01a_02500.s',
    '01a_02510.s',
    '01a_02600.s',
    '01a_02601.s',
    '01a_02602.s',
    '01a_02700.s',
    '01a_03000.s',
    '01a_03100.s',
    '01a_03200.s',
    '01a_03300.s',
    '01a_03400.s',
    '01a_03500.s',
    '01a_03600.s',
    '01a_03601.s',
    '01a_04000.s',
    '01a_04100.s',
    '01a_04200.s',
    '01a_04300.s',
    '01a_04400.s',
    '01a_04500.s',
    '01a_04600.s',
    '01a_04700.s',
    '01a_04800.s',
    '01a_05000.s',
    '01a_05100.s',
    '01a_05200.s',
    '01a_05300.s',
    '01a_05400.s',
    '01a_05410.s',
    '01a_05510.s',
    '01a_05600.s',
    '01a_05700.s',
    '01a_05800.s',
    '01a_05801.s',
    '01a_05802.s',
    '01a_06000.s',
    '01a_06100.s',
    '01a_06200.s',
    '01a_06300.s',
    '01a_06400.s',
    '01a_06500.s',
    '01a_06600.s',
    '01a_06700.s',
    '01a_06710.s',
    '01a_06720.s',
    '01a_06730.s',
    '01a_06800.s',
    '01a_07000.s',
    '01a_07100.s',
    '01a_07200.s',
    '01a_07300.s',
    '01a_07310.s',
    '01a_07400.s',
    '01a_07500.s',
    '01a_07600.s',
    '01a_07700.s',
    '01a_07800.s',
    '01a_07801.s',
    '01a_07802.s',
    '01a_07900.s',
    '01a_08000.s',
    '01a_08100.s',
    '01a_08200.s',
    '01a_08300.s',
    '01a_08301.s',
    '01a_08400.s',
    '01a_08500.s',
    '01a_08600.s',
    '01a_08700.s',
    '01a_08800.s',
    'start.s',
];

process.stdout.write('const game_script = {\n');
process.stdout.write(filelist.map(name => {
    const bytes = fs.readFileSync(`scripts_printemps/${name}`);
    const disasm = flowerscript.disassemble(bytes, cp932, false);
    const reasm = flowerscript.assemble(JSON.parse(disasm), cp932);
    console.assert(bytes.compare(reasm) == 0);
    return `"${name}": ${disasm}`;
}).join(',\n'));
process.stdout.write('};');
