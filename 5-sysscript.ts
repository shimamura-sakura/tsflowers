G.specialScripts[(G.sys.sysScript = '_system')] = [
  (G.sys.lblStart = 'start'),
  { bg_0f: { filename: '../system/LOGO1.bmp' } },
  { crossfade: { duration: 200 } },
  { dialogFade: { visible: 1, duration: 200 } },
  { dialog: { text: '游戏已启动，现在你可以加载存档或点击开始游戏' } },
  { jump: { label: 'startGame' } },

  (G.sys.lblExit = 'onExit'),
  { bg_0f: { filename: '../system/LOGO1.bmp' } },
  { crossfade: { duration: 200 } },
  { dialogFade: { visible: 1, duration: 200 } },
  { dialog: { text: '游戏结束，现在你可以加载存档或点击重新开始游戏' } },
  { jump: { label: 'startGame' } },

  'startGame',
  { selBeg: {} },
  { selAdd: { text: '开始游戏', label: 'startGameReal' } },
  { selEnd: {} },
  'startGameReal',
  { dialogVisible: { visible: false } },
  { jumpScript: { filename: 'start.s' } }
];
