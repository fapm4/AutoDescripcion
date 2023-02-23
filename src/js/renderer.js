const { webContents, dialog} = require('electron');

var ipcRenderer = require('electron').ipcRenderer;

const remote = require('@electron/remote');
const main = remote.require('./main');

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
    const botonR = document.querySelector('.botonR');
    botonR.addEventListener('click', subeFichero, true);

    const botonS = document.querySelector('.botonS');
    botonS.addEventListener('click', () => ipcRenderer.send('requestFile'), true);
});

ipcRenderer.on('not-file-found', (event, arg) => {
    alert('No se ha encontrado el fichero');
});

function subeFichero(){
    let modo = document.querySelectorAll('input[name=modo]:checked');

    switch(modo[0].value){
        case '1':
                // Modo 1: Generar formulario con los espacios
                const botonS = document.querySelector('.botonS');
                botonS.addEventListener('click', () => ipcRenderer.send('requestFile', '1'), true);
            break;
        case '2':
                // Modo 2: Grabar audio
            break;
        case '3':
                // Modo 3: IA
            break;
        default:
            alert('Error');
            break;
    }
}