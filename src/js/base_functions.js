const { ipcRenderer } = require('electron');
const say = require('say');
const fs = require('fs');
const path = require('path');

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

async function generaWebVTT(datos, modo) {
    let vtt = 'WEBVTT\n\n';

    let ruta_vtt = datos.actuales[0][0].split('\\').slice(0, -1).join('\\') + '\\subtitulos.vtt';
    if (modo == '1') {
        datos.forEach((dato, i) => {
            let fichero = dato[0];
            let start = dato[1] + '.000';
            let end = dato[2] + '.000';
            let texto = dato[3];

            vtt += `${i + 1}\n`;
            vtt += `${start} --> ${end}\n`;
            vtt += `${texto}\n\n`;

        });
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

        console.log(transcribir);

        await transcribeAudio(transcribir);
    }

    fs.writeFile(ruta_vtt, vtt, (err) => {
        if (err) console.log(err);
        // else ipcRenderer.send('descarga_contenido', ruta_vtt);
    });
}

async function transcribeAudio(audioData) {
    for (const audio of audioData) {
        try {
            const transcript = await recongnizeSpeech(audio[0]);
            console.log(transcript);
        }
        catch (err) {
            console.log(err);
        }
    }
}

async function recongnizeSpeech(audioPath) {
    return new Promise((resolve, reject) => {
        const recognition = new webkitSpeechRecognition() || new SpeechRecognition();

        recognition.lang = 'es-ES';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            resolve(transcript);
        };

        recognition.onerror = (event) => {
            reject(event.error);
        };

        recognition.onend = () => {
            reject(new Error('El reconocimiento de voz ha finalizado sin resultados.'));
        };

        recognition.audio = audioPath;
        recognition.start();
    });
}


module.exports = { redirige, queryAncestorSelector, convierteTiempo, getIndex, tiempoEnMilisegundos, tiempoEnSegundos, eventosNav, sintetiza, generaWebVTT };
