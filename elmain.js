const { app, BrowserWindow } = require('electron/main');
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webSecurity: false,
  });
  win.setMenuBarVisibility(false);
  win.setContentSize(1280, 720);
  win.setResizable(false);
  win.webContents.on('did-finish-load', () => win.webContents.insertCSS('html,body{margin:0;padding:0}'));
  win.loadFile('index.html');
};
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});