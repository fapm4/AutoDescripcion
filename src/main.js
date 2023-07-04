'use strict'

/////////////////////////// Imports ///////////////////////////
// Electron
const { app, BrowserWindow, Menu, ipcMain, dialog, systemPreferences } = require('electron');
const { download } = require('electron-dl');

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

//fs
const fs = require('fs');

/////////////////////////// Código ///////////////////////////
let ventanaPrincipal;

app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI');
app.commandLine.appendSwitch('enable-features', 'MediaRecorderAPI');

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

app.commandLine.appendSwitch('enable-speech-dispatcher');

// Tareas del código:
// 1. Crear y cargar la ventana principal

app.on('ready', () => {
    // Cuando la aplicación esté lista se crea la ventana principal
    ventanaPrincipal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSpeech: true
        },
        width: 1920,
        height: 1080,
    });

    ventanaPrincipal.webContents.setMaxListeners(30); // Establecer límite de escuchadores en 20

    // Se carga el archivo index.html
    ventanaPrincipal.loadURL(url.format({
        // Cambiar esto después
        pathname: path.join(__dirname, 'views', 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    // Se crea el menú de la aplicación
    Menu.setApplicationMenu(Menu.buildFromTemplate(templateMenu));

    // Cuando se haya cargado por completo el fichero HTML, mando un evento para añadir los eventos a los botones
    // del index.html
    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('carga_finalizada');
    });
});

// 2. Partiendo de la página de index.html, se redirige a la página de subir ficheros, inicio o información
ipcMain.on('redirige_pagina', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', arg),
        protocol: 'file',
        slashes: true,
    }));

    // Si es la página de subir ficheros, se añade un evento para que se pueda subir el fichero
    ventanaPrincipal.openDevTools();

    ventanaPrincipal.webContents.on('did-finish-load', () => {
        if (arg == 'sube_ficheros.html') {
            ventanaPrincipal.webContents.send('subir_ficheros');
        }
    });
});

var obj;
ipcMain.on('cargar_pantalla_configuracion', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'configuracion.html'),
        protocol: 'file',
        slashes: true,
    }));

    obj.modo = arg;
    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('pantalla_configuracion_cargada', obj.modo);
    });
});

// 4.1 Abre el diálogo para seleccionar el fichero
ipcMain.on('pedir_fichero', (event, arg) => {
    dialog.showOpenDialog({
        properties: ['openFile']
    }).then(result => {
        const path = result.filePaths[0];

        // 4.3 Si no se ha seleccionado ningún fichero, envío un mensaje de error
        if (path == "" || path == null) {
            ventanaPrincipal.webContents.send('no_fichero_seleccionado', 'No has seleccionado ningún fichero');
        }
        else {
            // Una vez se seleccione el fichero, lo almaceno en la base de datos y en el FS
            // ventanaPrincipal.webContents.send('fichero_seleccionado', 'Fichero seleccionado correctamente');
            addVideo(result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err)
    })
});

// Función auxiliar para obtener el nombre del fichero. Le añdo el prefijo "org_" para diferenciarlo
function getMediaName(media) {
    let media_name = media.split('\\');
    media_name = media_name[media_name.length - 1];
    return media_name;
}
// app.disableHardwareAcceleration()
// Guardado del fichero
async function addVideo(media) {
    let media_name = getMediaName(media);
    const video = fs.readFileSync(media);
    let modo;

    let ruta = path.join(__dirname, 'contenido', media_name.split('.')[0]);
    fs.mkdir(ruta, { recursive: true }, (err) => {
        if (err) throw err;
    });
    ruta = path.join(ruta, "org_" + media_name);

    fs.writeFile(ruta, video, (err) => {
        if (err) throw err;

        obj = {
            nombre_fichero: media_name,
            ruta_org: ruta,
        };
        // Actualizo el label del HTML
        ventanaPrincipal.webContents.send('actualiza_etiqueta', obj);
    });
}

// 4.2 Cuando se clicke sobre el botón de describir, empiezo el proceso de descripción -> ffmpeg.js
ipcMain.on('empezar_procesamiento', (event, arg) => {
    if (arg.length != 0) {
        obj.threshold_value = arg.threshold_value;
        obj.voz = arg.voz;
    }

    ventanaPrincipal.webContents.send('busca_silencios', obj);
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

    arg.volver = false;
    // 7.1 Creo el formulario
    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('cargar_tabla', arg);
    });
});

ipcMain.on('cambia_archivo_js', (event, arg) => {
    if (arg.modo == 2) {
        ventanaPrincipal.webContents.send('cambiar_archivo_grabacion', arg);
    }
    else {
        ventanaPrincipal.webContents.send('cambiar_archivo_sintesis', arg);
    }

});

ipcMain.on('actualiza_silencios', (event, arg) => {
    ventanaPrincipal.webContents.send('actualizar_silencios', arg);
});

ipcMain.on('listo_para_concatenar', (event, arg) => {
    if (arg.datos_audio.modo == 2) {
        ventanaPrincipal.webContents.send('concatenar_grabacion', arg);
    }
    else {
        console.log(arg);
        ventanaPrincipal.webContents.send('concatenar_sintesis', arg);
    }
});

ipcMain.on('video_concatenado', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'pagina_descarga.html'),
        protocol: 'file',
        slashes: true,
    }));

    console.log('Video concatenado: ', arg);
    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('pagina_descarga_cargada');
        ventanaPrincipal.webContents.send('carga_datos', arg);
    });
});

ipcMain.on('descarga_contenido', async (event, arg) => {
    try {

        const savePath = await dialog.showSaveDialog(ventanaPrincipal, {
            title: 'Guardar como',
            defaultPath: arg
        });

        if (savePath.filePath) {
            await download(BrowserWindow.getFocusedWindow(), arg, {
                directory: path.dirname(savePath.filePath),
                filename: path.basename(savePath.filePath),
                saveAs: false
            });
        }
    }
    catch (err) {
        console.log(err);
    }
});

ipcMain.on('volver_a_formulario', (event, arg) => {
    ventanaPrincipal.loadURL(url.format({
        pathname: path.join(__dirname, 'views', 'formulario_descripcion.html'),
        protocol: 'file',
        slashes: true,
    }));
    
    ventanaPrincipal.webContents.on('did-finish-load', () => {
        ventanaPrincipal.webContents.send('cargar_tabla_volver', paso);
    });

});

ipcMain.on('borrar_descripcion', (event, arg) => {
    let ruta = path.join(__dirname, 'contenido');

    try {
        fs.readdirSync(ruta).forEach(file => {
            ruta = path.join(ruta, file);
            ruta = path.join(ruta, arg.fichero);
            fs.unlinkSync(ruta, (err) => {
                console.log(err);
            });
        });
    }
    catch (err) {
        console.log(err);
    }

    ventanaPrincipal.webContents.send('actualiza_silencios', arg.silenciosRederer);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

module.exports = {
    addVideo
}