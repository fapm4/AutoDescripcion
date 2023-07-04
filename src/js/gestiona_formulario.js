const { ipcRenderer } = require('electron');
const { convierteTiempo } = require('../js/base_functions.js');
const { tiempoEnSegundos } = require('../js/base_functions.js');
const { actualizaBotones } = require('../js/procesa_grabacion.js');
const { eventosNav } = require('../js/base_functions.js');

let vuelto = false;

function getCurrentSecond(event) {
    console.log('getting');
    let btn = event.currentTarget;
    let input = btn.parentElement.querySelector('input');
    let player = document.querySelector('video');
    let currentTime = player.currentTime;
    input.value = convierteTiempo(currentTime);
}

function añadeStartEnd() {
    let botonesAdd = document.querySelectorAll('.btnAddCurrentTime');

    botonesAdd.forEach(boton => {
        boton.removeEventListener('click', () => getCurrentSecond(event));
        boton.addEventListener('click', () => getCurrentSecond(event));
    });
}

function añadeSilencios(modo, arg) {
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
                duration: (tiempoEnSegundos(end) - tiempoEnSegundos(start)).toString(),
                index: silenciosRenderer.length,
            };

            silenciosRenderer.push(obj);

            ipcRenderer.send('actualiza_silencios', silenciosRenderer, arg);
            let tablaSilencios = document.querySelector('#tablaSilencios');
            tablaSilencios.appendChild(tr);

            // actualizaBotones();

            inputs.forEach(input => {
                input.value = '';
            });
        }
    }
}
let silenciosRenderer;

function borrarSilencio(event, tr) {
    let index = tr.className.split('desc')[1];

    silenciosRenderer.splice(index, 1);
    tr.remove();
    let fichero = tr.className + ".mp3";

    let objs = {
        silenciosRenderer,
        fichero
    }

    ipcRenderer.send('borrar_descripcion', objs);
    ipcRenderer.send('actualiza_silencios', silenciosRenderer);
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

        btnPlay.addEventListener('click', function (event) { sintetiza(event, voz) }, false);
        span.appendChild(input);
        span.appendChild(btnPlay);
        tdInput.appendChild(span);
    }

    tr.appendChild(tdInput);
    return tr;
}

function enviarAudios(datos_audio, modo) {
    for (let i = 0; i < silenciosRenderer.length; i++) {
        if (silenciosRenderer[i].index == undefined) {
            silenciosRenderer[i].index = silenciosRenderer[i - 1].index + 1;
        }
    }
    datos_audio.silencios = silenciosRenderer;

    let volver = datos_audio.volver;
    let args = {
        volver,
        silenciosRenderer,
        datos_audio,
    };

    ipcRenderer.send('listo_para_concatenar', args);
}

// ESTO
let voz;

function mostrarFormulario(arg) {
    let modo;
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');

    silenciosRenderer = arg.silencios;

    if (arg.volver) {
        video.src = arg.datos_audio.ruta_org;
        modo = arg.datos_audio.modo;
        voz = arg.datos_audio.voz;
    }
    else {
        video.src = arg.ruta_org;
        modo = arg.modo;
        voz = arg.voz;
    }

    let btnEnviar = document.querySelector('#btnEnviar');
    btnEnviar.removeEventListener('click', () => enviarAudios(arg), true);
    btnEnviar.addEventListener('click', () => enviarAudios(arg), true);

    let tableSilencios = document.querySelector('#tablaSilencios');

    if (silenciosRenderer.length == 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'No se han encontrado silencios en el fichero',
            confirmButtonText: 'Ok'
        });
    }
    else {
        if (arg.volver == undefined || arg.volver == false || modo == 2) {
            silenciosRenderer.forEach((silencio, index) => {
                silencio.index = index;
            });

            var i = 0;
            silenciosRenderer.forEach(silencio => {
                let idDescripcion = `desc${i}`;
                let start = silencio.start;
                let end = silencio.end;
                let tr = creaTr(idDescripcion, start, end, modo);
                tableSilencios.appendChild(tr);
                i += 1;
            });
        }
        else if (arg.volver == true) {
            if (modo == 1) {
                var i = 0;
                console.log(silenciosRenderer);
                silenciosRenderer.forEach(silencio => {
                    let idDescripcion = `desc${i}`;
                    let start = silencio.start;
                    let end = silencio.end;
                    let texto = silencio.texto;

                    let tr = document.querySelector(`.${idDescripcion}`);
                    if (tr) {
                        tr.querySelector('input').value = texto;
                    }
                    else {
                        let tr = creaTr(idDescripcion, start, end, modo);
                        tr.querySelector('input').value = texto;
                        tableSilencios.appendChild(tr);
                    }
                    i += 1;
                });
            }
        }
    }
}

// TERMINAR ESTO -> AL VOLVER NO COGE EL TEXTO NUEVO

ipcRenderer.once('cargar_tabla', (event, arg) => {
    // Añado los eventos de los botones de +
    añadeStartEnd();

    // Añado el evento al botón de añadir silencio
    let btnAñadirSilencio = document.querySelector('#btnAñadirSilencios');
    btnAñadirSilencio.addEventListener('click', () => añadeSilencios(arg.modo, arg));

    if(arg.volver == false || arg.volver == undefined){
        mostrarFormulario(arg);
    }

    if(arg.modo == 2){
        ipcRenderer.send('cambiar_a_grabacion', arg);
    }
});

ipcRenderer.once('cargar_tabla_volver', (event, arg) => {
    console.log('Carga volver');
    mostrarFormulario(arg);
});