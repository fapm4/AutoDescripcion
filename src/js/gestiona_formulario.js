const { ipcRenderer } = require('electron');
const { convierteTiempo } = require('../js/base_functions.js');
const { tiempoEnSegundos } = require('../js/base_functions.js');

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

            inputs.forEach(input => {
                input.value = '';
            });
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

    if (divForm != undefined) {
        divForm.appendChild(divNuevosSilencios);
    }
}

function borrarSilencio(event, tr) {
    ipcRenderer.send('borrar_descripcion', tr.className + ".mp3");

    let index = tr.className.split('desc')[1];
    console.log(index);
    silenciosRender = silenciosRenderer.splice(index, 1);
    silenciosRenderer.indexOf(index + 1).index = index;
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

        btnPlay.addEventListener('click', function (event) { sintetiza(event, voz) }, false);
        span.appendChild(input);
        span.appendChild(btnPlay);
        tdInput.appendChild(span);
    }

    tr.appendChild(tdInput);
    return tr;
}

let silenciosRenderer;
function enviarAudios(datos_audio, modo) {
    for (let i = 0; i < silenciosRenderer.length; i++) {
        if (silenciosRenderer[i].index == undefined) {
            silenciosRenderer[i].index = silenciosRenderer[i - 1].index + 1;
        }
    }
    datos_audio.silencios = silenciosRenderer;

    let args = {
        silenciosRenderer,
        datos_audio,
    };

    console.log(args);
    console.log('Enviando audios');
    ipcRenderer.send('listo_para_concatenar', args);
}

// ESTO
let voz;
function mostrarFormulario(arg) {
    console.log('hola 2');
    let modo;
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');

    let argsToSend;

    modo = arg.modo;
    voz = arg.voz;
    video.src = arg.ruta_org;
    silenciosRenderer = arg.silencios;
    argsToSend = arg;

    silenciosRenderer.forEach((silencio, index) => {
        silencio.index = index;
    });

    let tabla = document.createElement('table');
    tabla.id = 'tablaSilencios';
    tabla.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th>Descripción</th></tr>';

    if (document.querySelector('#tablaSilencios') == undefined) {
        tablaAñadirSilencio(divForm, modo);
    }

    let btnEnviar = document.createElement('button');
    btnEnviar.innerHTML = 'Enviar';
    btnEnviar.className = 'botonR';
    btnEnviar.id = 'btnEnviar';

    btnEnviar.addEventListener('click', () => enviarAudios(argsToSend), true);

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

    if (divForm != undefined) {
        let divBotones = document.createElement('div');
        if (!arg.volver) {
            divForm.appendChild(tabla);
            divBotones.appendChild(btnEnviar);
        }
        // Los meto al DOM
        divForm.appendChild(divBotones);
    }

    // Una vez se ha cargado el formulario, añado los eventos a los botones desde el otro fichero
    // ipcRenderer.send('cambia_archivo_js', arg);
}

ipcRenderer.on('mostrar_formulario', (event, arg) => {
    mostrarFormulario(arg);
});

ipcRenderer.once('carga_datos', (event, arg) => {
    console.log('hola 1');
    let modo;
    let video = document.querySelector('video');
    let divForm = document.querySelector('.form');

    let argsToSend;
    let datos_a_cargar;
    modo = arg.datos_audio.modo;
    voz = arg.datos_audio.voz;
    video.src = arg.datos_audio.ruta_org;
    silenciosRenderer = arg.datos_audio.silencios;
    argsToSend = arg.datos_audio;

    datos_a_cargar = arg.filter(elem => Array.isArray(elem));

    silenciosRenderer.forEach((silencio, index) => {
        silencio.index = index;
    });

    let tabla = document.createElement('table');
    tabla.id = 'tablaSilencios';
    tabla.innerHTML = '<tr><th>Inicio</th><th>Fin</th><th>Descripción</th></tr>';

    if (document.querySelector('#tablaSilencios') == undefined) {
        tablaAñadirSilencio(divForm, modo);
    }

    let btnEnviar = document.createElement('button');
    btnEnviar.innerHTML = 'Enviar';
    btnEnviar.className = 'botonR';
    btnEnviar.id = 'btnEnviar';

    btnEnviar.addEventListener('click', () => enviarAudios(argsToSend), true);

    if (silenciosRenderer.length == 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'No se han encontrado silencios en el fichero',
            confirmButtonText: 'Ok'
        });
    }

    else {
        datos_a_cargar.forEach(silencio => {
            let idDescripcion = silencio[0].split('\\').pop().split('.')[0];
            let start = silencio[1];
            let end = silencio[2];
            let texto = silencio[3];

            let tr = document.querySelector(`.${idDescripcion}`);
            if (tr) {
                tr.querySelector('input').value = texto;
            }
            else {
                let tr = creaTr(idDescripcion, start, end, modo);
                tr.querySelector('input').value = texto;
                let tabla = document.querySelector('#tablaSilencios');
                tabla.appendChild(tr);
            }
        });
    }

    if (divForm != undefined) {
        let divBotones = document.createElement('div');
        if (!arg.volver) {
            divForm.appendChild(tabla);
            divBotones.appendChild(btnEnviar);
        }
        // Los meto al DOM

        divForm.appendChild(divBotones);
    }

    // Una vez se ha cargado el formulario, añado los eventos a los botones desde el otro fichero
    // ipcRenderer.send('cambia_archivo_js', arg);
});