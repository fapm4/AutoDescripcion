var ipcRenderer = require('electron').ipcRenderer;

const remote = require('@electron/remote');
const { spawn } = require('child_process');
const { statSync } = require('original-fs');
const main = remote.require('./main');
const imageSoruce = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.spreadshirt.es%2Fshop%2Fdesign%2Fboton%2Bplay%2Bcamiseta%2Bpremium%2Bhombre-D5975f73a59248d6110152d16%3Fsellable%3D30xwlz15z4Upe0m9kzy3-812-7&psig=AOvVaw0yfJZRipPcZ0fKQVnSDetn&ust=1677955190722000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCJiQtay0wP0CFQAAAAAdAAAAABAE";
/////////////////////////// Este código afecta a -> sube_ficheros.html e index.html ///////////////////////////
// 1. Añade a los botones el evento de redirección.
ipcRenderer.on('cargaFinalizada', (event, arg) => {
    const botones = document.querySelectorAll('.boton');

    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
    });
});

// Función que redirige a la página correspondiente
function redirige(event) {
    const currentTarget = event.currentTarget;
    let ruta;

    switch (currentTarget.id) {
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
    if (botonS != undefined) {
        botonS.addEventListener('click', () => ipcRenderer.send('requestFile'), true);
    }

    //4.2 Cuando se pulse el botón de describir, empieza a procesar el fichero subido
    let botonR = document.querySelector('.botonR');
    if (botonR != undefined) {
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
let voice;


function convierteTiempo(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

// 7.1 Tras cargar la pantalla de formulario añado todos los elemnentos HTML dinámicos
ipcRenderer.on('mostrar_formulario', (event, arg) => {
    // Tengo que mostrar el video
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');
    video.src = arg.datos_fichero.ruta;

    let silencios = arg.silencios;

    if (silencios.length == 0) {
        let span = document.createElement('span');
        span.innerHTML = 'No se han encontrado silencios';
    }
    else {
        // Por implementar:
        // 1. Crear tabla con los silencios - Hecho
        // 2. Crear botón de comprobar - Hacer
        // 3. Crear botón de enviar - Hacer
        let tabla = document.createElement('table');
        tabla.id = 'tablaSilencios';
        tabla.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th>Descripción</th></tr>';
        var i = 0;
        silencios.forEach(silencio => {
            let idDescripcion = `desc_${i}`;
            let start = convierteTiempo(silencio.start);
            let end = convierteTiempo(silencio.end);
            let tr = document.createElement('tr');
            tr.className = idDescripcion;
            tr.innerHTML = `<td>${start}</td><td>${end}</td><td><input type="text" class="inputSilencio"}"></td>`;
            tabla.appendChild(tr);
            i += 1;
        });
        divForm.appendChild(tabla);

        // Creo los dos botones
        let btnComprobar = document.createElement('button');
        btnComprobar.innerHTML = 'Comprobar';

        let btnGuardar = document.createElement('button');
        btnGuardar.innerHTML = 'Guardar';

        // Los meto al DOM
        let divBotones = document.createElement('div');
        divBotones.className = 'divBotones';
        divBotones.appendChild(btnComprobar);
        divBotones.appendChild(btnGuardar);
        divForm.appendChild(divBotones);

        speechSynthesis.addEventListener('voiceschanged', () => {
            voice = speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('es') && voice.name.includes('Spain') && voice.name.includes('victor'));
        });

        // Añado el evento de comprobar
        btnComprobar.addEventListener('click', () => compruebaAudios(silencios, arg.datos_fichero), true);
    }
});


function queryAncestorSelector(node, selector) {
    // Obtengo el nodo padre
    var parent = node.parentNode;

    // Saco todos los nodos con mi selector
    var all = document.querySelectorAll(selector);
    var found = false;
    while (parent !== document && !found) {
        for (var i = 0; i < all.length && !found; i++) {
            found = (all[i] === parent) ? true : false;
        }
        parent = (!found) ? parent.parentNode : parent;
    }
    return (found) ? parent : null;
}

var comprobado = false;
 
function compruebaAudios(silencios, datos_fichero) {
    comprobado = true;
    console.log('Comprobando audios...');
    comprobado = true;
    let inputs = document.querySelectorAll('.inputSilencio');
    let contador = 0;

    inputs.forEach(input => {
        if(input.value != ''){
            console.log('hola1');
        let tr = queryAncestorSelector(input, 'tr');
        let idDesc = tr.className;
        // let output = `${datos_fichero.ruta.split('org_')[0]}${idDesc}.wav`;
        let correct = false;
        console.log('hola2');
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = input.value;
        utterance.lang = voice;
        utterance.rate = 1;
        utterance.pitch = 1;
        console.log('hola3');
        let startTime;
        utterance.addEventListener('start', () => {
            startTime = new Date();
        });

        // Listen for the end event
        utterance.addEventListener('end', () => {
            const elapsed = (new Date() - startTime) / 1000;
    

            if(elapsed > silencios[contador].duration){
                console.log('La descripcion es mayor que el silencio');
                correct = false;
            }
            else{
                console.log('La descripcion es menor que el silencio');
                correct = true;
            }
            añadirComprobacion(tr, correct);
            contador += 1;
        });

        // Speak the utterance
        speechSynthesis.speak(utterance);
        }
    });
}

function añadirComprobacion(tr, correct){
    // Añadir circulo para indicar que está bien o mal
    let existe = tr.querySelector('.comprobacion');

    let spanCorrecto = document.createElement('span');
    spanCorrecto.title = 'La descripción se adecua al tiempo';
    spanCorrecto.innerHTML = '🟢';

    let spanIncorrecto = document.createElement('span');
    spanIncorrecto.title = 'La descripción no se adecua al tiempo';
    spanIncorrecto.innerHTML = '🔴';

    if(existe != null){
        if(existe.innerHTML == '🔴'){
            if(correct){
                console.log('jopa');
                existe.appendChild(spanCorrecto);
            }
        }
        else if(existe.innerHTML == '🟢'){
            if(!correct){
                existe.appendChild(spanIncorrecto);
            }
        }
    }
    else{
        let td = document.createElement('td');
        td.className = "comprobacion";
        td.appendChild(correct ? spanCorrecto : spanIncorrecto);
        tr.appendChild(td);
    }
}

// poner boton para añadir tiempo actual

// inputs.forEach(input => {
//     // Obtengo el tr, que tiene el id de la descripción
//     let tr = queryAncestorSelector(input, 'tr');
//     let idDesc = tr.className;
//     let desc = input.value;1
//     let output = `${datos_fichero.ruta.split('org_')[0]}${idDesc}.wav`;
//     console.log(desc);

//     var synth = window.speechSynthesis;
//     var voices = synth.getVoices();
//     console.log(voices);
// });