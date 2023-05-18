const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const { tiempoEnSegundos } = require('../js/procesa_grabacion.js');
const fs = require('fs');
const { path } = require('path');
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
        boton.removeEventListener('click', redirige, true);
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

function pedir_fichero() {
    ipcRenderer.send('pedir_fichero');
}

ipcRenderer.on('subir_ficheros', (event, arg) => {
    // 2.2 Cuando se pulse el botón de subir fichero, se abre el diálogo para seleccionar el fichero
    const botonS = document.querySelector('.botonS');
    if (botonS != undefined) {
        botonS.removeEventListener('click', pedir_fichero, true);
        botonS.addEventListener('click', pedir_fichero, true);
    }
});

function cargar_pantalla_configuracion(modo) {
    ipcRenderer.send('cargar_pantalla_configuracion', modo);
}

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

    btnConf.addEventListener('click', cargar_pantalla_configuracion, true);
    btnConf.addEventListener('click', function (event) { cargar_pantalla_configuracion(modo) }, true);
});

// 4.3 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.once('no_fichero_seleccionado', (event, arg) => {
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
    let player = document.querySelector('video');
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
    tablaNuevoSilencio.innerHTML = '<tr><th>Inicio</th><th>Fin</th></tr>';

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

function borrarSilencio(event, tr) {
    let index = tr.className.split('desc')[1];
    silenciosRenderer.splice(index, 1);
    console.log(silenciosRenderer);
    tr.remove();
}

function creaTr(idDescripcion, start, end, modo) {
    let tr = document.createElement('tr');
    tr.className = idDescripcion;

    let tdStart = document.createElement('td');
    let startContainer = document.createElement('div');
    startContainer.style.position = 'relative';
    tdStart.appendChild(startContainer);

    let startText = document.createElement('span');
    startText.innerHTML = start;
    startContainer.appendChild(startText);

    let btnBorrar = document.createElement('button');
    btnBorrar.className = 'btnBorrarSilencio';
    btnBorrar.innerHTML = 'x';
    startContainer.appendChild(btnBorrar);
    btnBorrar.addEventListener('click', function (event) { borrarSilencio(event, tr) }, false);

    let tdEnd = document.createElement('td');
    tdEnd.innerHTML = end;

    let tdInput = document.createElement('td');
    tdInput.className = 'input';

    let btnPlay = document.createElement('button');
    btnPlay.className = 'btnPlay botonR';
    btnPlay.innerHTML = "⏵︎";

    tr.appendChild(tdStart);
    tr.appendChild(tdEnd);

    if (modo == 2) {
        let span = document.createElement('span');
        span.clasName = "botonesVoz";

        let btnGrabar = document.createElement('button');
        btnGrabar.id = `${idDescripcion}_grabar`;
        btnGrabar.className = 'btnGrabar botonR';
        btnGrabar.innerHTML = 'Grabar';

        // btnGrabar.addEventListener('click', function (event) { grabarVoz(event) }, false);

        let btnParar = document.createElement('button');
        btnParar.id = `${idDescripcion}_parar`;
        btnParar.className = 'btnParar botonR';
        btnParar.innerHTML = 'Parar';

        // btnParar.addEventListener('click', function (event) { pararVoz(event) }, false);

        span.appendChild(btnGrabar);
        span.appendChild(btnParar);
        span.appendChild(btnPlay);
        tdInput.appendChild(span);
    }
    else {
        let span = document.createElement('span');
        span.clasName = "botonesVoz";

        let input = document.createElement('input');
        input.type = 'text';
        input.id = `${idDescripcion}_texto`;
        input.className = 'inputSilencio';

        // input.addEventListener('keydown', function (event) { actualizaTiempo(event) }, false);

        // btnPlay.addEventListener('click', function (event) { sintetiza(event, voz) }, false);
        span.appendChild(input);
        span.appendChild(btnPlay);
        tdInput.appendChild(span);
    }

    tr.appendChild(tdInput);
    return tr;
}

let silenciosRenderer;
function enviarAudios(datos_audio, modo) {
    silenciosRenderer = silenciosRenderer.map((silencio, index) => {
        return { ...silencio, index };
    });

    let args = {
        silenciosRenderer,
        datos_audio,
    };

    console.log('Enviando audios');
    ipcRenderer.send('listo_para_concatenar', args);
}

let voz;
ipcRenderer.once('mostrar_formulario', (event, arg) => {
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');

    let modo = arg.modo;
    voz = arg.voz;

    if (video != undefined) {
        video.src = arg.ruta_org;
    }

    silenciosRenderer = arg.silencios;

    let tabla = document.createElement('table');
    tabla.id = 'tablaSilencios';
    tabla.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th>Descripción</th></tr>';

    tablaAñadirSilencio(divForm, modo);

    let btnEnviar = document.createElement('button');
    btnEnviar.innerHTML = 'Enviar';
    btnEnviar.className = 'botonR';
    btnEnviar.id = 'btnEnviar';

    btnEnviar.addEventListener('click', () => enviarAudios(arg), true);

    if (silenciosRenderer.length == 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'No se han encontrado silencios en el fichero',
            confirmButtonText: 'Ok'
        });
    }
    else {
        var i = 0;
        silenciosRenderer.forEach(silencio => {
            let idDescripcion = `desc${i}`;
            let start = silencio.start;
            let end = silencio.end;
            let tr = creaTr(idDescripcion, start, end, modo);
            tabla.appendChild(tr);
            i += 1;
        });
    }
    divForm.appendChild(tabla);

    // Los meto al DOM
    let divBotones = document.createElement('div');
    divBotones.appendChild(btnEnviar);
    divForm.appendChild(divBotones);

    // Una vez se ha cargado el formulario, añado los eventos a los botones desde el otro fichero
    ipcRenderer.send('cambia_archivo_js', arg);

});

function generaWebVTT(datos) {
    console.log(datos);
    let vtt = 'WEBVTT\n\n';
    let ruta_absoluta = window.location.href.split('/').slice(0, -3).join('/') + '/';

    let folder = ruta_absoluta + datos[0][0].split('\\').slice(0, -1).join('\\');
    let ruta_vtt = `${folder}\\descripcion.vtt`;
    ruta_vtt = ruta_vtt.replace(/\\/g, '/');

    // Síntesis
    if (datos[0].length == 4) {
        datos.forEach((dato, i) => {
            let fichero = dato[0];
            let start = dato[1] + '.000';
            let end = dato[2] + '.000';
            let texto = dato[3];

            vtt += `${i + 1}\n`;
            vtt += `${start} --> ${end}\n`;
            vtt += `${texto}\n\n`;
        });

        fs.writeFile(ruta_vtt, vtt, (err) => {
            if (err) reject(err);
            else ipcRenderer.send('descarga_contenido', ruta_vtt);
        });
    }
    // Grabación
    else {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = true;

        // Iniciar el reconocimiento de voz antes de iterar sobre los datos
        recognition.addEventListener('start', () => {
            console.log('Reconocimiento de voz iniciado');
        });

        recognition.addEventListener('end', () => {
            console.log('Reconocimiento de voz finalizado');
        });

        recognition.addEventListener('result', (event) => {
            console.log('asdasda');
            const transcript = event.results[0][0].transcript;
            console.log(transcript);
        });

        const audio = new Audio(ruta_absoluta + datos[0][0]);
        audio.addEventListener('loadedmetadata', () => {
            recognition.start();
        });

        audio.load();


        // datos.forEach((dato, i) => {
        //     let fichero = ruta_absoluta + dato[0];
        //     fichero = fichero.replace(/\\/g, '/');
        //     let start = dato[1] + '.000';
        //     let end = dato[2] + '.000';

        //     console.log(start, end);

        //     vtt += `${i + 1}\n`;
        //     vtt += `${start} --> ${end}\n`;

        //     console.log(fichero);
        //     const audio = new Audio(fichero);

        //     audio.addEventListener('loadedmetadata', () => {
        //         // No es necesario llamar a recognition.start() aquí
        //         // Reconocimiento de voz en curso

        //         recognition.addEventListener('result', (event) => {
        //             const transcript = event.results[event.results.length - 1][0].transcript;
        //             vtt += `${transcript}\n\n`;
        //             recognition.stop();
        //         });

        //     });
        // });

        console.log(vtt);
        // recognition.addEventListener('end', () => {
        //     fs.writeFileSync(ruta_vtt, vtt, (err) => {
        //         if (err) console.log(err);
        //         // else ipcRenderer.send('descarga_contenido', ruta_vtt);
        //     });
        // });

        // // Iniciar el reconocimiento de voz
        // recognition.start();

    }
}

ipcRenderer.on('pagina_descarga_cargada', (event, arg) => {
    // arg[1] es el video modificado y arg[0] los audios con los silencios para el webvtt
    let videoSrc = arg[arg.length - 1];
    let form = document.querySelector('.form');
    if (form != undefined) {
        form.remove();
    }

    let bloque = document.querySelector('.bloquePrincipal');

    let video = document.querySelector('video');
    video.src = videoSrc;

    let span = document.createElement('span');
    span.clasName = "botonesVoz";

    let btnDescargarVideo = document.createElement('button');
    btnDescargarVideo.className = "boton botonR";
    btnDescargarVideo.innerHTML = "Descargar video";
    btnDescargarVideo.addEventListener('click', () => ipcRenderer.send('descarga_contenido', videoSrc), true);


    let btnDescargarWebVTT = document.createElement('button');
    btnDescargarWebVTT.className = "boton botonR";
    btnDescargarWebVTT.innerHTML = "Descargar WEBVTT";
    btnDescargarWebVTT.addEventListener('click', () => generaWebVTT(arg.slice(0, arg.length - 1)), true);

    span.appendChild(btnDescargarVideo);
    span.appendChild(btnDescargarWebVTT);

    bloque.appendChild(span);
});

function queryAncestorSelector(node, selector) {
    var parent = node.parentNode;

    while (parent !== document) {
        if (parent.matches(selector)) {
            return parent;
        }
        parent = parent.parentNode;
    }

    return null;
}


module.exports.queryAncestorSelector = queryAncestorSelector;
module.exports.convierteTiempo = convierteTiempo;