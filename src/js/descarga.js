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
    datos.silencios = silenciosActualizados;
    datos.volver = true;

    console.log(datos);

    // ipcRenderer.send('volver_a_formulario', datos);
}

ipcRenderer.once('pagina_descarga_cargada', (event, arg) => {
    eventosNav();

    let span = document.createElement('span');
    span.className = "botonesVoz";
    span.id = "botonesDescarga";

    let btnDescargarVideo = document.querySelector('#btnDescargaVideo');
    btnDescargarVideo.addEventListener('click', () => ipcRenderer.send('descarga_contenido', videoSrc), false);

    let btnDescargarWebVTT = document.querySelector('#btnDescargaVTT');
    btnDescargarWebVTT.removeEventListener('click', generaWebVTT, false);
    btnDescargarWebVTT.addEventListener('click', () => { generaWebVTT(datos, datos.datos_audio.modo) }, false);

    let btnVolver = document.querySelector('#btnVolver');
    btnVolver.addEventListener('click', clickVolver, false);
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