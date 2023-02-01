'use strict'

// Importamos Electron
const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

let ventanaPrincipal;

// Creamos y cargamos la página principal
app.on('ready', () => {
    ventanaPrincipal = new BrowserWindow({});
    ventanaPrincipal.loadURL(url.format({
        pathname: path.joint(__dirname, 'views', 'index.html'),
        protocol: file,
        slashes: true
    }));
});