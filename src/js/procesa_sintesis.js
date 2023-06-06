const say = require('say');
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec, execSync } = require('child_process');

const { ipcRenderer } = require('electron');
const { getIndex } = require('../js/base_functions.js');
const { tiempoEnMilisegundos } = require('../js/base_functions.js');
const { convierteTiempo } = require('../js/base_functions.js');

let audiosGenerados = [];

let silencios = [];
let datos_audio;

ipcRenderer.on('concatenar_sintesis', async (event, arg) => {
    silencios = arg.silenciosRenderer;
    datos_audio = arg.datos_audio;

    console.log(datos_audio);
    console.log(silencios);
    await preComprobacion()
        .then(() => {
            let inputs = document.querySelectorAll(".inputSilencio");
            concatena(audiosGenerados, silencios, inputs);
        });
});

async function preComprobacion() {
    let inputs = document.querySelectorAll('.inputSilencio');
    let promesas = [];

    console.log(inputs);
    for (const input of inputs) {
        if (input.value != "") {
            let output = datos_audio.audio_extraido.split('org')[0] + input.id.split('_')[0] + '.mp3';
            audiosGenerados.push(output);

            let promesa = new Promise((resolve, reject) => {
                say.export(input.value, datos_audio.voz, 1, output, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });

            });

            promesas.push(promesa);
        }
    }

    return Promise.all(promesas);
}

async function concatena(audios, silencios, textos) {
    let ruta_video = datos_audio.ruta_org;
    let ruta_video_output = ruta_video.replace('org_', 'mod_');

    let inputs = '';
    let filter = '';
    let preFiltro = '';

    let data = [];
    data.actuales = [];

    console.log(audios);
    for (let i = 0; i < audios.length; i++) {
        let audio = audios[i];
        let indice = getIndex(audio);
        console.log(indice);
        console.log(silencios.find(elem => elem.index == indice));

        let start = silencios.find(elem => elem.index == indice).start;
        let end = silencios.find(elem => elem.index == indice).end;
        let startM = tiempoEnMilisegundos(start);

        data.actuales.push([audio.replace('.blob', '.mp3'), start, end, textos[i].value]);

        // Empiezo a crear el comando
        inputs += ` -i ${audio.replace('.blob', '.mp3')}`;
        // Empiezo con el filtro
        if (startM > 0) {
            filter += `[${i + 1}:a]adelay=${startM}|${startM}[a${i + 1}];`;
        }
        else {
            filter += `[${i + 1}:a]adelay=500|500[a${i + 1}];`;
        }

        // Flags adicionales
        preFiltro += `[a${i + 1}]`;
    }

    filter += `[0:a]${preFiltro}amix=inputs=${audios.length + 1}[a]`;

    data.datos_audio = datos_audio;
    data.ruta_mod = ruta_video_output;

    let command = `${ffmpegPath} -i ${ruta_video} ${inputs} -filter_complex "${filter}" -map 0:v -map [a] -c:v copy -c:a aac -strict experimental -y ${ruta_video_output}`;

    console.log(command);

    try {
        const stdout = execSync(command);
        console.log(data);
        ipcRenderer.send('video_concatenado', data);
    } catch (error) {
        console.error(error);
    }
}

// function actualizaTiempo(event) {
//     let tecla = event.key;

//     if (tecla == 'Enter') {
//         let plataforma = process.platform;
//         let duracion = 0;
//         const velocidad = plataforma === 'darwin' ? 175 : 100;
//         let texto = event.currentTarget.value;

//         say.speak(texto, elegidoIdioma, velocidad, { volume: 0.0 }, (err) => {
//             if (err) {
//                 console.log(err);
//             }
//             else {
//                 duracion = Math.ceil(texto.length / velocidad) * 1000;
//             }
//         });
//     }
// }