const electron = require('electron');
const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');


let win;

function createWindow() { 
    win = new BrowserWindow({
        width: 1400,
        height: 1000,
        frame: false,
        icon: `file://${__dirname}/dist/assets/logo.png`
    });
    // win.loadURL('http://localhost:4200');
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/dist/chatApp/index.html'),
        protocol: 'file:',
        slashes: true
    }))
    // win.loadURL(`file:/${__dirname}/dist/index.html`)
    win.on('closed', () => win = null);
}

app.on('ready',createWindow);
app.on('activate', () => {
    if(win === null) { 
        createWindow();
    }
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
      }
})