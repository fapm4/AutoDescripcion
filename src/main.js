'use strict'

/////////////////////////// Imports ///////////////////////////
// Electron
const {app, BrowserWindow, Menu, ipcMain, remote} = require('electron');


// URL
const url = require('url');

// Path
const path = require('path');

var ipcRenderer = require('electron').ipcRenderer;


// Electron Reload
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`),
        ignored: /node_modules|[/\\]\./
    });
}

var ffmpeg = require('ffmpeg');

/////////////////////////// Código ///////////////////////////
// Ventana principal con alcance global
let ventanaPrincipal;

require('@electron/remote/main').initialize();

const templateMenu = [
    {
        label: 'DevTools',
        submenu: [
            {
                label: 'Mostrar/Ocultar DevTools',
                accelerator: 'Ctrl+D',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    }
];

// Cuando la aplicación esté lista
app.on('ready', () => {
    // Se crea la ventana principal
    ventanaPrincipal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    require('@electron/remote/main').enable(ventanaPrincipal.webContents);
    
    // Se carga el archivo index.html
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('cargaFinalizada', 'Añadiendo eventos a los botones');
    });
    // Se crea el menú de la aplicación
    Menu.setApplicationMenu(Menu.buildFromTemplate(templateMenu));

    ipcMain.on('redirige', (event, arg) => {
        ventanaPrincipal.loadURL(url.format({
            pathname: path.join(__dirname, 'views', arg),
            protocol: 'file',
            slashes: true
        }));

        if(arg == 'sube_ficheros.html'){
            ventanaPrincipal.webContents.on('did-finish-load', () => {
                ventanaPrincipal.webContents.send('redireccionFinalizada', 'Añadir evento asíncrono');
            });
        }
    });
});

function addVideo(media){
    const con = getConn();
    console.log(media);
}


module.exports = {
    addVideo
};