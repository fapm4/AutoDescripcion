const { webContents, dialog} = require('electron');

var ipcRenderer = require('electron').ipcRenderer;

const remote = require('@electron/remote');
const main = remote.require('./main');

/////////////////////////// Este código afecta a -> sube_ficheros.html e index.html ///////////////////////////
// 1. Añade a los botones el evento de redirección.
ipcRenderer.on('cargaFinalizada', (event, arg) => {
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
    });
});

// Función que redirige a la página correspondiente
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

    // Envío el nombre del fichero para redireccionar
    ipcRenderer.send('redirige', ruta);
}

// 4. Una vez se cargue la página de subir ficheros, añado el evento de subir fichero
ipcRenderer.on('redireccion_subeFicheros', (event, arg) => {
    //4.1 Cuando se pulse el botón de subir fichero, se abre el diálogo para seleccionar el fichero
    const botonS = document.querySelector('.botonS');
    if(botonS != undefined){
        botonS.addEventListener('click', () => ipcRenderer.send('requestFile'), true);
    }

    //4.2 Cuando se pulse el botón de describir, empieza a procesar el fichero subido
    let botonR = document.querySelector('.botonR');
    if(botonR != undefined){
        let modo = document.querySelector('input[name=modo]:checked');
        botonR.addEventListener('click', () => ipcRenderer.send('empieza_procesamiento', modo.value), true);
    }
});

// 4.3 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.on('not-file-found', (event, arg) => {
    alert('No se ha encontrado el fichero');
});

// Si no, actualiza el nombre del label con el nombre del fichero
ipcRenderer.on('actualiza-label', (event, arg) => {
    let label = document.querySelector('#fileName');
    label.innerHTML = arg;
});

ipcRenderer.on('fichero_subido', (event, arg) => {
    console.log('Fichero subido correctamente a la BBDD');
});

/////////////////////////// Este código afecta a -> formulario_descripcion.html ///////////////////////////
let plyr = require('plyr');
const player = new plyr('#player');


function convierteTiempo(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

ipcRenderer.on('mostrar_formulario', (event, arg) => {
    // Tengo que mostrar el video
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');
    video.src = arg.datos_fichero.ruta;
    console.log(arg);
    console.log(video);

    let silencios = arg.silencios;

    if(silencios.length == 0){
        let span = document.createElement('span');
        span.innerHTML = 'No se han encontrado silencios';
    }
    else{
        // Por implementar:
        // 1. Crear tabla con los silencios - Hecho
        // 2. Crear botón de comprobar - Hacer
        // 3. Crear botón de enviar - Hacer
        let tabla = document.createElement('table');
        tabla.id = 'tablaSilencios';
        tabla.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th>Descripción</th></tr>';
        silencios.forEach(silencio => {
            let start = convierteTiempo(silencio.start);
            let end = convierteTiempo(silencio.end);
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${start }</td><td>${end}</td><td><input type="text" class="inputSilencio" id="${silencio.id}"></td><td><button class="btnComprobar></button></td>`;
            tabla.appendChild(tr);
        });
        divForm.appendChild(tabla);

        
    }
});