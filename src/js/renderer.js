const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const { tiempoEnSegundos } = require('../js/procesa_grabacion.js');
const { convierteTiempo } = require('../js/gestiona_formulario.js');
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
            if (err) console.log(err);
            else ipcRenderer.send('descarga_contenido', ruta_vtt);
        });
    }
    // Grabación
    else {

    }
}

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