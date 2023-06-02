const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const { tiempoEnSegundos } = require('../js/procesa_grabacion.js');
const { redirige } = require('../js/base_functions.js');
const fs = require('fs');
const { path } = require('path');
/////////////////////////// Este código afecta a -> index.html ///////////////////////////
// 1. Añado evento a los botones de la página index.html
ipcRenderer.on('carga_finalizada', (event, args) => {
    console.log(window.location.href);
    // Saco los botones de Inicio, Informaciónn y Describir
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.removeEventListener('click', redirige, false);
        boton.addEventListener('click', redirige, false);
    });
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
