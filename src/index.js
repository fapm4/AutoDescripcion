'use strict'

/////////////////////////// Imports ///////////////////////////
// Electron
const { app, BrowserWindow, Menu} = require('electron');

// URL
const url = require('url');

// Path
const path = require('path');

// Electron Reload
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron')
});
/////////////////////////// Código ///////////////////////////

// Ventana principal con alcance global
let ventanaPrincipal;

// Cuando la aplicación esté lista
app.on('ready', () => {
    // Se crea la ventana principal
    ventanaPrincipal = new BrowserWindow({});
    
    // Se carga el archivo index.html
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    // Se crea el menú de la aplicación
    Menu.setApplicationMenu(Menu.buildFromTemplate([]));
});
