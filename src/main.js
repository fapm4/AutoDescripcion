'use strict'

/////////////////////////// Imports ///////////////////////////
// Electron
const {app, BrowserWindow, Menu, ipcMain, remote, dialog} = require('electron');

// URL
const url = require('url');

// Path
const path = require('path');


// Electron Reload
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`),
        ignored: /node_modules|[/\\]\./
    });
}

// FFMPeg
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);


// DB
const db = require('./js/db');

//fs
const fs = require('fs');

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
        // Cambiar esto después
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    ventanaPrincipal.openDevTools();

    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('cargaFinalizada', 'Añadiendo eventos a los botones');
    });
    // Se crea el menú de la aplicación
    Menu.setApplicationMenu(Menu.buildFromTemplate(templateMenu));

});

ipcMain.on('redirige', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', arg),
        protocol: 'file',
        slashes: true,
    }));

    if(arg == 'sube_ficheros.html'){
        ventanaPrincipal.webContents.on('did-finish-load', () => {
            ventanaPrincipal.webContents.send('redireccionFinalizada', 'Añadir evento asíncrono');
        });
    }
});

ipcMain.on('requestFile', (event, arg) => {
    console.log('argumento: ' + event);
    dialog.showOpenDialog({
        properties: ['openFile']
    }).then(result => {
        const path = result.filePaths[0];
        console.log(path);

        if(path == "" || path == null){
            ventanaPrincipal.webContents.send('not-file-found','No has seleccionado ningún fichero');
        }
        else{
            addVideo(result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err)
    })
});

function getMediaName(media){
    let media_name = media.split('/');
    media_name = media_name[media_name.length - 1];
    return "org_" + media_name;
}

var obj;

async function addVideo(media){
    let media_name = getMediaName(media);

    await db.connect((err) => {
        if (err) throw err;
        console.log('Conectado a la base de datos MySQL');
        console.log(media);

        // Lo guardo el FS
        const video = fs.readFileSync(media);
        let ruta = path.join(__dirname, 'videos', media_name);

        fs.writeFile(ruta, video, (err) => {
            if (err) throw err;
            console.log('Video añadido al FS');
        });

        ventanaPrincipal.webContents.send('actualiza-label', media_name.substring(4, media_name.length));

        // Guardo la referencia en la base de datos
        db.query('INSERT INTO video (name, ruta) VALUES (?, ?)', [media_name, ruta], (err, result) => {
            if (err) throw err;
            console.log('Video añadido a la base de datos');
        });

        obj = {
            media_name,
            ruta
        };

        ventanaPrincipal.webContents.send('fichero_subido', obj);
    });
}

ipcMain.on('procesa', () => {
    ventanaPrincipal.webContents.send('procesa-check', obj);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        db.query('DELETE FROM video', (err, result) => {
            if (err) throw err;
            console.log('Videos borrados de la base de datos');
        });

        db.end((err => {
            if (err) throw err;
                console.log('Conexión cerrada');
        }));
    }
});

module.exports = {
    addVideo
}