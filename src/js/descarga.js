const { ipcRenderer } = require('electron');
const { getIndex } = require('../js/base_functions.js');
const { generaWebVTT } = require('../js/base_functions.js');
const { eventosNav } = require('../js/base_functions.js');

let datos;
let videoSrc;

const clickVolver = () => {
    let audios_actuales = datos.actuales;
    let silenciosActualizados = []

    audios_actuales.forEach(audio => {
        let nombre = audio[0];
        let indice = getIndex(nombre);

        let [ruta, start, end, texto] = audio;

        let tmp = {
            ruta: ruta,
            start: start,
            end: end,
            texto: texto,
            index: indice,
            duration: (parseFloat(end) - parseFloat(start)).toFixed(1),
        };

        silenciosActualizados.push(tmp);
    });

    delete datos.actuales;
    // delete arg.datos_audio.silencios;
    datos.datos_audio.silencios = silenciosActualizados;
    datos.volver = true;

    ipcRenderer.send('volver_a_formulario', datos);
}

ipcRenderer.on('pagina_descarga_cargada', (event, arg) => {
    let bloque = document.querySelector('.bloquePrincipal');
    eventosNav();

    let span = document.createElement('span');
    span.className = "botonesVoz";
    span.id = "botonesDescarga";

    let btnDescargarVideo = document.createElement('button');
    btnDescargarVideo.className = "boton botonR";
    btnDescargarVideo.innerHTML = "Descargar video";
    btnDescargarVideo.addEventListener('click', () => ipcRenderer.send('descarga_contenido', videoSrc), false);


    let btnDescargarWebVTT = document.createElement('button');
    btnDescargarWebVTT.className = "boton botonR";
    btnDescargarWebVTT.innerHTML = "Descargar WEBVTT";

    btnDescargarWebVTT.removeEventListener('click', generaWebVTT, false);
    btnDescargarWebVTT.addEventListener('click', () => { generaWebVTT(datos, datos.datos_audio.modo) }, false);

    let btnVolver = document.createElement('button');
    btnVolver.className = "boton botonR";
    btnVolver.innerHTML = "Volver";
    btnVolver.addEventListener('click', clickVolver, false);

    span.appendChild(btnDescargarVideo);
    span.appendChild(btnDescargarWebVTT);
    span.appendChild(btnVolver);
    bloque.appendChild(span);
});

ipcRenderer.on('carga_datos', (event, arg) => {
    datos = arg;
    let video = document.querySelector('.custom-player');
    if (arg.ruta_mod) {
        video.src = arg.ruta_mod;
    }
    else {
        let vid_src = arg.filter((element) => {
            if (typeof element === 'string' && element.includes('mod_')) {
                return element[0];
            }
         });

    video.src = vid_src[0];
    }

    videoSrc = video.src;
});