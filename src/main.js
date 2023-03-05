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

    // Se carga la pantalla principal. Envío evento cuando se termine de cargar el DOM
    // para añadir los eventos a los botones
    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('cargaFinalizada', 'Añadiendo eventos a los botones');
    });
    // Se crea el menú de la aplicación
    Menu.setApplicationMenu(Menu.buildFromTemplate(templateMenu));

});

// 2. Una vez obtenga la ruta (pagina HTML), la renderizo
ipcMain.on('redirige', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', arg),
        protocol: 'file',
        slashes: true,
    }));

    // 3. Si es la página de subir ficheros, añado el evento de subir fichero
    ventanaPrincipal.openDevTools();
    if(arg == 'sube_ficheros.html'){
        ventanaPrincipal.webContents.on('did-finish-load', () => {
            ventanaPrincipal.webContents.send('redireccion_subeFicheros', 'Añadir evento asíncrono');
        });
    }
});

// 4.1 Abre el diálogo para seleccionar el fichero
ipcMain.on('requestFile', (event, arg) => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }).then(result => {
        const path = result.filePaths[0];

        // 4.3 Si no se ha seleccionado ningún fichero, envío un mensaje de error
        if(path == "" || path == null){
            ventanaPrincipal.webContents.send('not-file-found','No has seleccionado ningún fichero');
        }
        else{
            // Una vez se seleccione el fichero, lo almaceno en la base de datos y en el FS
            addVideo(result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err)
    })
});

// Función auxiliar para obtener el nombre del fichero. Le añdo el prefijo "org_" para diferenciarlo
function getMediaName(media){
    let media_name = media.split('/');
    media_name = media_name[media_name.length - 1];
    return media_name;
}

var obj;

// Guardado del fichero
async function addVideo(media){
    let media_name = getMediaName(media);

    await db.connect((err) => {
        if (err) throw err;
        console.log('Conectado a la base de datos MySQL');

        // Lo guardo el FS
        const video = fs.readFileSync(media);
        
        let ruta = path.join(__dirname, 'contenido', media_name.split('.')[0]);
        fs.mkdir(ruta, {recursive: true}, (err) => {
            if (err) throw err;
        });
        ruta = path.join(ruta, "org_" + media_name);

        fs.writeFile(ruta, video, (err) => {
            if (err) throw err;
        });

        // Actualizo el label del HTML
        ventanaPrincipal.webContents.send('actualiza-label', media_name);

        // Guardo la referencia en la base de datos
        db.query('INSERT INTO video (name, ruta) VALUES (?, ?)', [media_name, ruta], (err, result) => {
            if (err) throw err;
        });

        obj = {
            media_name,
            ruta
        };

        // 5. Una vez se haya subido el fichero, se envía un evento para indicarque se puede procesar
        // No es necesario
        ventanaPrincipal.webContents.send('fichero_subido', obj);
    });
}

var modo;
// 4.2 Cuando se clicke sobre el botón de describir, empiezo el proceso de descripción -> ffmpeg.js
ipcMain.on('empieza_procesamiento', (event, arg) => {
    obj.modo = arg;
    ventanaPrincipal.webContents.send('procesa-check', obj);
});

// 6. Recibo el evento de pantalla de carga y renderizo la pantalla de carga
// Preguntar a sergio si es necesario
ipcMain.on('pantalla_carga', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'pantalla_carga.html'),
        protocol: 'file',
        slashes: true,
    }));

    // 6.1 Evento para mostrar el spinner
    //ventanaPrincipal.webContents.send('pantalla_carga_lista', arg);
});

// 7. Recibo el evento de que el audio ya ha sido analizado
ipcMain.on('audio_analizado', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'formulario_descripcion.html'),
        protocol: 'file',
        slashes: true,
    }));

    // 7.1 Creo el formulario
    ventanaPrincipal.webContents.on('did-finish-load', () => {    
        ventanaPrincipal.webContents.send('mostrar_formulario', arg);
    });

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        db.query('DELETE FROM video', (err, result) => {
            if (err) throw err;
        });

        db.end((err => {
            if (err) throw err;
        }));
    }
});

module.exports = {
    addVideo
}