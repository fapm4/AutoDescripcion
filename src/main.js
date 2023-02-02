'use strict'

/////////////////////////// Imports ///////////////////////////
// Electron
const {app, BrowserWindow, Menu} = require('electron');

// URL
const url = require('url');

// Path
const path = require('path');

// Electron Reload
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron')
});

let ipcMain = require('electron').ipcMain;
let ipcRenderer = require('electron').ipcRenderer;

/////////////////////////// Código ///////////////////////////

// Ventana principal con alcance global
let ventanaPrincipal;

// Cuando la aplicación esté lista
app.on('ready', () => {
    // Se crea la ventana principal
    ventanaPrincipal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'js', 'preload.js'),
            nativeWindowOpen: true,
        }
    });

    ventanaPrincipal.openDevTools();
    
    // Se carga el archivo index.html
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    // Se crea el menú de la aplicación
    Menu.setApplicationMenu(Menu.buildFromTemplate([]));
});

