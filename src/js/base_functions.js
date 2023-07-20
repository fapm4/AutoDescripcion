const { ipcRenderer } = require('electron');
const say = require('say');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function eventosNav() {
    let nav = document.querySelector('.nav');
    let botones = nav.querySelectorAll('.boton');

    botones.forEach(boton => {
        boton.removeEventListener('click', redirige, false);
        boton.addEventListener('click', redirige, false);
    });
}

function redirige(event) {
    const currentTarget = event.currentTarget;
    switch (currentTarget.id) {
        case 'btnInicio':
            ipcRenderer.send('redirige_pagina', 'index.html');
            break;

        case 'btnInfo':
            ipcRenderer.send('redirige_pagina', 'index.html');
            break;

        case 'btnDescr':
            ipcRenderer.send('redirige_pagina', 'sube_ficheros.html');
            break;

        case 'guia':
            ipcRenderer.send('redirige_pagina', 'guia.html');
            break;
    };
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

function convierteTiempo(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

function getIndex(output) {
    let filename = output.split('\\').pop();
    const regex = /desc(\d+)\./;
    const match = filename.match(regex);
    const indice = match[1];
    return indice;
}

function tiempoEnMilisegundos(tiempo) {
    let partes = tiempo.split(':');
    let horas = parseInt(partes[0]);
    let minutos = parseInt(partes[1]);
    let segundos = parseInt(partes[2]);

    return (horas * 3600 + minutos * 60 + segundos) * 1000;
}

function tiempoEnSegundos(tiempo) {
    var partes = tiempo.split(":");
    var horas = parseInt(partes[0]);
    var minutos = parseInt(partes[1]);
    var segundos = parseInt(partes[2]);

    return horas * 3600 + minutos * 60 + segundos;
}

async function sintetiza(event, voz) {
    let btn = event.currentTarget;
    let input = btn.previousElementSibling;
    say.speak(input.value, voz);
}

ipcRenderer.on('swal_cargado', (event, datos) => {
    let vtt = 'WEBVTT\n\n';

    let ruta_vtt = datos.actuales[0][0].split('\\').slice(0, -1).join('\\') + '\\subtitulos.vtt';
    let modo = datos.datos_audio.modo;

    console.log(datos);
    
    if (modo == '1') {
        datos.actuales.forEach((dato, i) => {
            let fichero = dato[0];
            let start = dato[1] + '.000';
            let end = dato[2] + '.000';
            let texto = dato[3];

            vtt += `${i + 1}\n`;
            vtt += `${start} --> ${end}\n`;
            vtt += `${texto}\n\n`;

        });

        console.log(vtt);
    }
    else {
        let ficheros = fs.readdirSync(path.dirname(datos.datos_audio.audio_extraido)).filter(fichero => fichero.endsWith('.mp3') && fichero.startsWith('desc'));
        let base_path = path.dirname(datos.datos_audio.audio_extraido);

        let transcribir = datos.actuales.map(data => {
            return [path.basename(data[0]), data[1], data[2]];
        })
            .filter(item => ficheros.includes(item[0]))
            .map(item => {
                return [path.join(base_path, item[0]), item[1], item[2]];
            });

        transcribir.forEach(fichero => {
            const exec = `whisper ${fichero[0]} --language Spanish --output_format txt --output_dir ${base_path}/texts`;
            execSync(exec);

            let temp = fs.readFileSync(path.join(base_path, 'texts', path.basename(fichero[0], '.mp3') + '.txt'), 'utf8');
            let texto = temp.split('\n').filter(linea => linea != '').join(' ');

            vtt += `${path.basename(fichero[0])}\n`;
            vtt += `${fichero[1]} --> ${fichero[2]}\n`;
            vtt += `${texto}\n\n`;
        });
    }

    Swal.close();
    
    fs.writeFile(ruta_vtt, vtt, (err) => {
        if (err) console.log(err);
        else ipcRenderer.send('descarga_contenido', ruta_vtt);
    });
});

async function generaWebVTT(datos) {

    const alert = Swal.fire({
        icon: 'info',
        title: 'Procesando...',
        text: 'Se está procesando el audio para generar los subtítulos, cuando termine, podrás descargarl el archivo',
    });

    ipcRenderer.send('swal_cargado', datos);
}

module.exports = { redirige, queryAncestorSelector, convierteTiempo, getIndex, tiempoEnMilisegundos, tiempoEnSegundos, eventosNav, sintetiza, generaWebVTT };
