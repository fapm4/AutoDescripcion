let ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('eventoBotones', (event, arg) => {
    document.getElemenyByTahName('button');
});