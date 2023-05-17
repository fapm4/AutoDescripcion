var ipcRenderer = require('electron').ipcRenderer;
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');
const { convierteTiempo } = require('../js/renderer.js');


// 4.2 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.once('busca_silencios', (event, arg) => {
    // Comienzo a procesar el fichero
    console.log('Procesando fichero...');
    console.log(arg);

    let ruta_org = arg.ruta_org;
    let nombre_fichero = arg.nombre_fichero;
    let modo = arg.modo;
    let voz = arg.voz;

    let nombre_video = arg.ruta_org.split('\\').pop().split('.')[0];
    const audio_extraido = `src\\contenido\\${nombre_video.substring(4, nombre_video.length)}\\${nombre_video}.mp3`;

    // 6. Mando un evento para mostrar la pantalla de carga - Por hacer
    let datos_audio = {
        audio_extraido,
        ruta_org,
        nombre_fichero,
        modo,
        voz
    }

    ffmpeg(ruta_org)
        .output(audio_extraido)
        .noVideo()
        .audioCodec('libmp3lame')
        .on('end', async () => {
            let threshold_value = arg.threshold_value;

            if (threshold_value == null) {
                threshold_value = await ruidoMedio(audio_extraido);
            }

            await obtenIntervalos(audio_extraido, threshold_value)
                .then(silencios => {                
                    datos_audio.silencios = silencios;
                    console.log(datos_audio);
        
                    // 7. Silencios detectados, enviamos evento para  cargar la pantalla del formulario
                    // para añadir el texto
                    ipcRenderer.send('audio_analizado', datos_audio);
                });
        })
        .on('error', (err) => {
            console.log('Error al separar el audio:', err.message);
        })
        .run();
});

// Función auxiliar para obtener los silencios del audio
async function obtenIntervalos(filePath, silenceThreshold) {
    return new Promise((resolve, reject) => {
        const cmd = `${ffmpegPath} -i ${filePath} -af "silencedetect=n=${silenceThreshold}dB:d=2.0" -f null -`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            const silenceStart = stderr.match(/silence_start: \d+\.\d+/g);
            const silenceEnd = stderr.match(/silence_end: \d+\.\d+/g);

            let silences = [];

            if (!silenceStart || !silenceEnd) {
                console.log('No silences found.');
                resolve(silences);
            } else {
                for (var i = 0; i < silenceStart.length && i < silenceEnd.length; i++) {
                    let start = convierteTiempo(silenceStart[i].split(' ')[1]);
                    let end = convierteTiempo(silenceEnd[i].split(' ')[1]);
                    let duration = (silenceEnd[i].split(' ')[1] - silenceStart[i].split(' ')[1]).toFixed(1);
                    let obj = {
                        start,
                        end,
                        duration
                    };

                    silences.push(obj);
                }

                resolve(silences);
            }
        });
    });
}

async function ruidoMedio(output) {
    return new Promise((resolve, reject) => {
        let command = `${ffmpegPath} -i ${output} -vn -filter_complex "ebur128=peak=true" -f null -`;
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.err(err);
                return;
            }

            const regex = /I:         -?\d+\.\d+ LUFS/gm;
            const match = stderr.match(regex);
            if (match) {
                const result = match[match.length - 1];
                let regexValue = /-?\d+\.\d+/gm;
                const matchValue = result.match(regexValue);
                resolve(parseFloat(matchValue[0]));
            }
        });
    });
}