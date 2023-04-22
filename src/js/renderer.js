var ipcRenderer = require('electron').ipcRenderer;
const remote = require('@electron/remote');
const fs = require('fs');
const main = remote.require('./main');
const imageSoruce = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.spreadshirt.es%2Fshop%2Fdesign%2Fboton%2Bplay%2Bcamiseta%2Bpremium%2Bhombre-D5975f73a59248d6110152d16%3Fsellable%3D30xwlz15z4Upe0m9kzy3-812-7&psig=AOvVaw0yfJZRipPcZ0fKQVnSDetn&ust=1677955190722000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCJiQtay0wP0CFQAAAAAdAAAAABAE";
/////////////////////////// Este código afecta a -> sube_ficheros.html e index.html ///////////////////////////

let esperandoVoces;
// 1. Añado evento a los botones de la página index.html
ipcRenderer.once('carga_finalizada', (event, arg) => {
    speechSynthesis.addEventListener('voiceschanged', () => {
        esperandoVoces = speechSynthesis.getVoices();
    });

    // Saco los botones de Inicio, Informaciónn y Describir
    const botones = document.querySelectorAll('.boton');

    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
    });
});

// 1.1 Función que redirige a la página correspondiente
function redirige(event) {
    const currentTarget = event.currentTarget;
    let ruta;

    switch (currentTarget.id) {
        case 'btnInicio':
            ruta = 'index.html';
            break;
        case 'btnInfo':
            ruta = 'index.html';
            break;
        case 'btnDescr':
            ruta = 'sube_ficheros.html';
            break;
        default:
            prompt('Error');
    };

    // Envío el nombre del fichero para redireccionar
    ipcRenderer.send('redirige_pagina', ruta);
}

// 2. Una vez se cargue la página de subir ficheros, añado el evento de subir fichero
let modo;
ipcRenderer.on('subir_ficheros', (event, arg) => {
    // 2.2 Cuando se pulse el botón de subir fichero, se abre el diálogo para seleccionar el fichero
    const botonS = document.querySelector('.botonS');
    if (botonS != undefined) {
        botonS.addEventListener('click', () => ipcRenderer.send('pedir_fichero'), true);
    }
});

ipcRenderer.on('fichero_seleccionado', (event, arg) => {
    const btnConf = document.querySelector('#btnConf');
    let radios = document.querySelectorAll('input[name=modo]');
    if (radios != undefined) {
        modo = document.querySelector('input[name=modo]:checked').value;

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                modo = radio.value;
            });
        });
    }

    btnConf.addEventListener('click', () => ipcRenderer.send('cargar_pantalla_configuracion', modo), true);
});

// 4.3 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.on('no_fichero_seleccionado', (event, arg) => {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'No has seleccionado ningún fichero',
    });
});

// Si no, actualiza el nombre del label con el nombre del fichero
ipcRenderer.on('actualiza_etiqueta', (event, arg) => {
    let label = document.querySelector('#fileName');
    label.innerHTML = arg;
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

// 7.1 Tras cargar la pantalla de formulario añado todos los elemnentos HTML dinámicos
function getCurrentSecond(event) {
    let btn = event.currentTarget;
    let input = btn.previousSibling;
    let player = document.querySelector('#player');
    let currentTime = player.currentTime;
    input.value = convierteTiempo(currentTime);
}

function añadeStartEnd() {
    let td = document.createElement('td');
    let span = document.createElement('span');
    span.className = 'spanNuevoSilencio';

    let input = document.createElement('input');
    input.type = 'text';
    input.class = 'inputNuevoSilencio';

    let btnGetCurrentSecond = document.createElement('button');
    btnGetCurrentSecond.className = 'btnAddCurrentTime';
    btnGetCurrentSecond.innerHTML = '+';

    btnGetCurrentSecond.addEventListener('click', () => getCurrentSecond(event)), true;

    span.appendChild(input);
    span.appendChild(btnGetCurrentSecond);
    td.appendChild(span);

    return td;
}

// Añadir comprobaciones
function añadirSilencios(event, modo) {
    let tabla = document.querySelector('#tablaNuevoSilencio');
    let inputs = tabla.querySelectorAll('input');

    let start = inputs[0].value;
    let end = inputs[1].value;

    if (start == '' || end == '') {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'No has introducido todos los campos',
        });
    }
    else {
        if (start == end) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'El inicio y el fin no pueden ser iguales',
            });
        }
        else {
            let idDescripcion = `desc${silenciosRenderer.length}`;
            let tr = creaTr(idDescripcion, start, end, modo);
            // Añadir los eventos de los botones
            let obj = {
                start: start,
                end: end,
                duration: (tiempoEnSegundos(end) - tiempoEnSegundos(start)).toString()
            };

            silenciosRenderer.push(obj);
            console.log('puta');
            let tablaSilencios = document.querySelector('#tablaSilencios');
            tablaSilencios.appendChild(tr);
        }
    }
}

function tablaAñadirSilencio(divForm, modo) {
    // Añado form de añadir silencios
    let divNuevosSilencios = document.createElement('div');
    divNuevosSilencios.id = 'divNuevosSilencios';

    let tablaNuevoSilencio = document.createElement('table');
    tablaNuevoSilencio.className = 'tablaSilencios';
    tablaNuevoSilencio.id = 'tablaNuevoSilencio';
    tablaNuevoSilencio.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th></tr>';

    let tr = document.createElement('tr');

    let tdStart = añadeStartEnd();
    let tdEnd = añadeStartEnd();

    tr.appendChild(tdStart);
    tr.appendChild(tdEnd);

    tablaNuevoSilencio.appendChild(tr);
    divNuevosSilencios.appendChild(tablaNuevoSilencio);

    let btnAñadirSilencios = document.createElement('button');
    btnAñadirSilencios.className = 'botonR boton';
    btnAñadirSilencios.innerHTML = 'Añadir silencio';
    btnAñadirSilencios.id = 'btnAñadirSilencios';

    divNuevosSilencios.appendChild(btnAñadirSilencios);
    btnAñadirSilencios.addEventListener('click', () => añadirSilencios(event, modo), true);

    divForm.appendChild(divNuevosSilencios);
}

function creaTr(idDescripcion, start, end, modo) {
    let tr = document.createElement('tr');
    tr.className = idDescripcion;

    let tdStart = document.createElement('td');
    tdStart.innerHTML = start;

    let tdEnd = document.createElement('td');
    tdEnd.innerHTML = end;

    let tdInput = document.createElement('td');
    tdInput.className = 'input';

    tr.appendChild(tdStart);
    tr.appendChild(tdEnd);

    if (modo == 2) {
        let span = document.createElement('span');
        span.clasName = "botonesVoz";

        let btnGrabar = document.createElement('button');
        btnGrabar.id = `${idDescripcion}_grabar`;
        btnGrabar.className = 'btnGrabar botonR';
        btnGrabar.innerHTML = 'Grabar';

        btnGrabar.addEventListener('click', function (event) { grabarVoz(event) }, false);

        let btnParar = document.createElement('button');
        btnParar.id = `${idDescripcion}_parar`;
        btnParar.className = 'btnParar botonR';
        btnParar.innerHTML = 'Parar';

        btnParar.addEventListener('click', function (event) { pararVoz(event) }, false);

        let btnPlay = document.createElement('button');
        btnPlay.className = 'btnPlay botonR';
        btnPlay.innerHTML = "⏵︎";

        span.appendChild(btnGrabar);
        span.appendChild(btnParar);
        span.appendChild(btnPlay);
        tdInput.appendChild(span);
    }

    tr.appendChild(tdInput);
    return tr;
}

let silenciosRenderer;
function enviarAudios(datos_fichero) {
    silenciosRenderer = silenciosRenderer.map((silencio, index) => {
        return { ...silencio, index };
    });

    let args = {
        silenciosRenderer,
        datos_fichero
    };

    ipcRenderer.send('cambia_archivo_js_grabacion', args);
}

ipcRenderer.on('mostrar_formulario', (event, arg) => {
    // Tengo que mostrar el video
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');
    let modo = arg.datos_fichero.modo;

    video.src = arg.datos_fichero.ruta;

    silenciosRenderer = arg.silencios;
    datos_fichero = arg.datos_fichero;

    tablaAñadirSilencio(divForm, modo);

    let btnEnviar = document.createElement('button');
    btnEnviar.innerHTML = 'Enviar';
    btnEnviar.className = 'botonR';
    btnEnviar.id = 'btnEnviar';


    btnEnviar.addEventListener('click', () => enviarAudios(datos_fichero), true);

    if (silenciosRenderer.length == 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'No se han encontrado silencios en el fichero',
        });
    }
    else {
        let tabla = document.createElement('table');
        tabla.id = 'tablaSilencios';
        tabla.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th>Descripción</th></tr>';
        var i = 0;
        silenciosRenderer.forEach(silencio => {
            let idDescripcion = `desc${i}`;
            let start = silencio.start;
            let end = silencio.end;
            let tr = creaTr(idDescripcion, start, end, modo);
            // El usuario ha elegido la opción de describir manualmente
            // if (modo == 1) {
            //     let input = document.createElement('input');
            //     input.type = 'text';
            //     input.className = 'inputSilencio';
            //     tdInput.appendChild(input);
            // }
            // El usuario ha elegido la opción de describir con voz
            tabla.appendChild(tr);
            i += 1;
        });

        divForm.appendChild(tabla);

        // Los meto al DOM
        let divBotones = document.createElement('div');
        divBotones.appendChild(btnEnviar);
        divForm.appendChild(divBotones);


        // speechSynthesis.addEventListener('voiceschanged', () => {
        //     voice = speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('es') && voice.name.includes('Spain') && voice.name.includes('victor'));
        // });

        // // Añado el evento de comprobar
        // btnEnviar.addEventListener('click', () => compruebaAudios(silencios, datos_fichero), true);
    }
});

// function compruebaAudios(silencios, datos_fichero) {
//     var audioBlobs = [];
//     let audioChunks = [];
//     let promesas = [];
//     console.log('Comprobando audios...');
//     let inputs = document.querySelectorAll('.inputSilencio');
//     let contadorInputs = 0;
//     let contadorErrores = 0;

//     navigator.mediaDevices.getUserMedia({ audio: true })
//         .then(stream => {
//             inputs.forEach((input) => {
//                 audioChunks = [];
//                 let recorder = new MediaRecorder(stream);

//                 let tr = queryAncestorSelector(input, 'tr');
//                 if (input.value == '' || input.value == null) {
//                     añadirComprobacion(tr, false);
//                     contadorErrores += 1;
//                 } else {
//                     let idDesc = tr.className;
//                     let output = `${datos_fichero.ruta.split('org_')[0]}${idDesc}.blob`;
//                     const utterance = new SpeechSynthesisUtterance();
//                     utterance.text = input.value;
//                     utterance.lang = voice;
//                     utterance.rate = 1;
//                     utterance.pitch = 1;

//                     let startTime;
//                     utterance.addEventListener('start', () => {
//                         startTime = new Date();
//                     });

//                     utterance.addEventListener('end', () => {
//                         const elapsed = (new Date() - startTime) / 1000;
//                         const correct = elapsed > silencios[contadorInputs].duration ? false : true;
//                         contadorErrores += añadirComprobacion(tr, correct);
//                         contadorInputs += 1;
//                         recorder.stop();
//                         // resolve();
//                     });

//                     // promesas.push(promesa);
//                     promesa = new Promise((resolve, reject) => {
//                         recorder.addEventListener('dataavailable', e => {
//                             audioChunks.push(e.data);
//                             if (recorder.state == 'inactive') {
//                                 let blob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
//                                 audioBlobs.push([blob, output]);
//                                 resolve(audioBlobs);
//                                 chunks = [];
//                             }
//                         });
//                     });

//                     promesas.push(promesa);
//                     speechSynthesis.speak(utterance);
//                     recorder.start();
//                 }
//             });

//             return Promise.all(promesas);
//         })
//         .then(audioBlobs => {
//             if (contadorErrores > 0) {
//                 Swal.fire({
//                     title: '¡Atención!',
//                     text: 'Hay errores en la descripción de los silencios. Por favor, revisa los campos en rojo',
//                     icon: 'warning',
//                     showCancelButton: true,
//                     confirmButtonText: 'Enviar',
//                     cancelButtonText: 'Cancelar'
//                 }).then((result) => {
//                     if (result.value) {
//                         // El usuario hizo clic en "Enviar"
//                         console.log('Listo para enviar.');
//                         guardarAudios(audioBlobs);
//                     }
//                     else {
//                         // El usuario hizo clic en "Cancelar"
//                         console.log('El usuario canceló el envío.');
//                     }
//                 });
//             }
//             else {
//                 console.log('Listo para enviar.');
//                 guardarAudios(audioBlobs);
//             }
//         })
//         .catch(err => console.log(err));
// }

// function blobToArrayBuffer(blob) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result);
//         reader.onerror = reject;
//         reader.readAsArrayBuffer(blob);
//     });
// }

// function guardarAudios(audioBlobs) {
//     // Filtra los objetos undefined y toma el primero
//     let filtered = audioBlobs.filter(blob => blob != undefined)[0];
//     console.log(filtered);

//     for (let i = 0; i < filtered.length; i++) {
//         let blob = filtered[i][0];
//         let output = filtered[i][1];

//         blobToArrayBuffer(blob).then(arrayBuffer => {
//             fs.writeFile(output, Buffer.from(arrayBuffer), (err) => {
//                 if (err) console.log(err);
//                 else {
//                     console.log('Archivo guardado correctamente')
//                 }
//             });
//         });
//     }
// }

// function añadirComprobacion(tr, correct) {
//     let existe = tr.querySelector('.comprobacion');

//     let span = document.createElement('span');
//     span.title = correct ? 'La descripción se adecua al tiempo' : 'La descripción no se adecua al tiempo';
//     span.className = correct ? 'correcto' : 'incorrecto';
//     span.innerHTML = correct ? '🟢' : '🔴';

//     if (existe) {
//         return actualizaEstado(existe.querySelector('span'), correct);
//     }
//     else {
//         let td = document.createElement('td');
//         td.className = 'comprobacion';
//         td.appendChild(span);
//         tr.appendChild(td);

//         if (span.className === 'correcto') {
//             return 0;
//         }
//         else {
//             return 1;
//         }
//     }
// }

// function actualizaEstado(spanExiste, correct) {
//     if (spanExiste.innerHTML === '🔴') {
//         if (correct) {
//             spanExiste.innerHTML = '🟢';
//             spanExiste.title = 'La descripción se adecua al tiempo';
//             spanExiste.className = 'correcto';
//             return 0;
//         }
//     }
//     else if (spanExiste.innerHTML === '🟢') {
//         if (!correct) {
//             spanExiste.innerHTML = '🔴';
//             spanExiste.title = 'La descripción no se adecua al tiempo';
//             spanExiste.className = 'incorrecto';
//             return 1;
//         }
//     }
// }

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

module.exports.queryAncestorSelector = queryAncestorSelector;

var comprobado = false;
// poner boton para añadir tiempo actual