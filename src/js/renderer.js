var ipcRenderer = require('electron').ipcRenderer;
const remote = require('@electron/remote');
const fs = require('fs');
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

let silencios;
let datos_fichero;
// 7.1 Tras cargar la pantalla de formulario añado todos los elemnentos HTML dinámicos
ipcRenderer.on('mostrar_formulario', (event, arg) => {
    // Tengo que mostrar el video
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');
    video.src = arg.datos_fichero.ruta;

    silencios = arg.silencios;
    datos_fichero = arg.datos_fichero;

    if (silencios.length == 0) {
        let span = document.createElement('span');
        span.innerHTML = 'No se han encontrado silencios';
    }
    else {
        // Por implementar:
        // 1. Crear tabla con los silencios - Hecho
        // 2. Crear botón de enviar - Hacer
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
        let btnEnviar = document.createElement('button');
        btnEnviar.innerHTML = 'Enviar';
        btnEnviar.className = 'botonR';

        // Los meto al DOM
        let divBotones = document.createElement('div');
        divBotones.appendChild(btnEnviar);
        divForm.appendChild(divBotones);

        speechSynthesis.addEventListener('voiceschanged', () => {
            voice = speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('es') && voice.name.includes('Spain') && voice.name.includes('victor'));
        });

        // Añado el evento de comprobar
        btnEnviar.addEventListener('click', () => ipcRenderer.send('get_sources'), true);
    }
});

ipcRenderer.on('sources', (event, sources) => {
    try {
        stream = navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                },

                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                    }
                }
            },
        });

        console.log("Sources:", sources);
        console.log("Stream:", stream);
    }
    catch (err) {
        console.log(err);
    }
});

function compruebaAudios(silencios, datos_fichero) {
    console.log('Comprobando audios...');
    let inputs = document.querySelectorAll('.inputSilencio');
    let contadorInputs = 0;
    let contadorErrores = 0;
    let stream;

    ipcRenderer.send('get_sources');
    ipcRenderer.on('sources', (event, sources) => {
        try {
            stream = navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                    },

                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                        }
                    }
                },
            });

            console.log("Sources:", sources);
            console.log("Stream:", stream);
        }
        catch (err) {
            console.log(err);
        }
    });

    inputs.forEach((input) => {
        let tr = queryAncestorSelector(input, 'tr');
        if (input.value == '' || input.value == null) {
            añadirComprobacion(tr, false);
            contadorErrores += 1;
        } else {
            let idDesc = tr.className;
            let output = `${datos_fichero.ruta.split('org_')[0]}${idDesc}.blob`;
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = input.value;
            utterance.lang = voice;
            utterance.rate = 1;
            utterance.pitch = 1;
            console.log("Stream:", stream);
            const audioStream = new MediaStream();
            audioStream.addTrack(stream.getAudioTracks()[0]);
            utterance.audioStream = audioStream;

            speechSynthesis.speak(utterance);

            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm; codecs=opus'
            });

            const chunks = [];

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
                fs.writeFile(output, blob, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Audio guardado correctamente');
                });
            };

            setTimeout(() => {
                recorder.stop();
            }, 5000);

            recorder.start();
        }
    });

}
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
//                         const correct = elapsed > silencios[contadorInputs].duration ? fals : true;
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

function añadirComprobacion(tr, correct) {
    let existe = tr.querySelector('.comprobacion');

    let span = document.createElement('span');
    span.title = correct ? 'La descripción se adecua al tiempo' : 'La descripción no se adecua al tiempo';
    span.className = correct ? 'correcto' : 'incorrecto';
    span.innerHTML = correct ? '🟢' : '🔴';

    if (existe) {
        return actualizaEstado(existe.querySelector('span'), correct);
    }
    else {
        let td = document.createElement('td');
        td.className = 'comprobacion';
        td.appendChild(span);
        tr.appendChild(td);

        if (span.className === 'correcto') {
            return 0;
        }
        else {
            return 1;
        }
    }
}

function actualizaEstado(spanExiste, correct) {
    if (spanExiste.innerHTML === '🔴') {
        if (correct) {
            spanExiste.innerHTML = '🟢';
            spanExiste.title = 'La descripción se adecua al tiempo';
            spanExiste.className = 'correcto';
            return 0;
        }
    }
    else if (spanExiste.innerHTML === '🟢') {
        if (!correct) {
            spanExiste.innerHTML = '🔴';
            spanExiste.title = 'La descripción no se adecua al tiempo';
            spanExiste.className = 'incorrecto';
            return 1;
        }
    }
}

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
// poner boton para añadir tiempo actual