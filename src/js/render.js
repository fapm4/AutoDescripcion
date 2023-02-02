const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.send('añadeEventoBotones-req', 'redirige');

ipcRenderer.on('añadeEventoBotones-res', (event, arg) => {
    console.log(arg);
});