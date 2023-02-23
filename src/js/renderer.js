const { webContents, dialog} = require('electron');

var ipcRenderer = require('electron').ipcRenderer;

const remote = require('@electron/remote');
const main = remote.require('./main');
let modo = document.querySelectorAll('input[name=modo]:checked');

const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);

ipcRenderer.on('cargaFinalizada', (event, arg) => {
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
    });
});

function redirige(event){
    
    const currentTarget = event.currentTarget;
    let ruta;

    switch(currentTarget.id){
        case 'btnInicio':
            ruta = 'index.html';
            break;
        case 'btnInfo':
            ruta = 'info.html';
            break;
        case 'btnDescr':
            ruta = 'sube_ficheros.html';
            break;
        default:
            prompt('Error');
    };

    ipcRenderer.send('redirige', ruta);
}

ipcRenderer.on('redireccionFinalizada', (event, arg) => {
    const botonS = document.querySelector('.botonS');
    botonS.addEventListener('click', () => ipcRenderer.send('requestFile'), true);

    let botonR = document.querySelector('.botonR');
    botonR.addEventListener('click', () => ipcRenderer.send('procesa'), true);
});

ipcRenderer.on('procesa-check', (event, arg) => {
    if(arg == undefined){
        alert('No has seleccionado ningún fichero');
    }
});


ipcRenderer.on('not-file-found', (event, arg) => {
    alert('No se ha encontrado el fichero');
});

ipcRenderer.on('actualiza-label', (event, arg) => {
    let label = document.querySelector('#fileName');
    label.innerHTML = arg;
});

ipcRenderer.on('fichero_subido', (event, arg) => {
    console.log('Fichero subido correctamente a la BBDD');
});
