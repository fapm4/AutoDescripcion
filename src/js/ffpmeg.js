var ipcRenderer = require('electron').ipcRenderer;
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path')
const { exec } = require('child_process');


// 4.2 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.on('procesa-check', (event, arg) => {
    if (arg == undefined) {
        alert('No has seleccionado ningún fichero');
    }
    else {
        // Comienzo a procesar el fichero
        console.log('Procesando fichero...');
        let file = arg.ruta.split('\\').pop().split('.')[0];

        // Mi PC
        const output = `C:\\Users\\panch\\Desktop\\TFG\\AutoDescripcion\\src\\contenido\\${file.substring(4, file.length)}\\${file}.wav`;
        // const output = `C:\\Users\\francip\\Desktop\\Repos\\AutoDescripcion\\src\\contenido\\${file.substring(4, file.length)}\\${file}.wav`;
        let ruta = arg.ruta;
        let media_name = arg.media_name;
        let modo = arg.modo;

        // 6. Mando un evento para mostrar la pantalla de carga - Por hacer
        let datos_fichero = {
            output,
            ruta,
            media_name,
            modo
        };

        ffmpeg(ruta)
            .output(output)
            .noVideo()
            .audioCodec('pcm_s16le')
            .audioChannels(1)
            .on('end', () => {
                console.log('Audio extraído correctamente');
                getIntervals(output, '-30', (silencios) => {
                    let obj = {
                        datos_fichero,
                        silencios
                    };

                    console.log(`Se encontraron ${silencios.length} silencios.`);
                    console.log('Silencios: ', silencios);

                    // 7. Silencios detectados, enviamos evento para  cargar la pantalla del formulario
                    // para añadir el texto
                    ipcRenderer.send('audio_analizado', obj, arg.modo);
                });
            })
            .run();
    }
});

ipcRenderer.on('pantalla_carga_lista', (event, arg) => {

    console.log(arg);
    // Saco el audio del vídeo y lo almaceno en wav

});

// Función auxiliar para obtener los silencios del audio
function getIntervals(filePath, silenceThreshold, callback) {
    const cmd = `${ffmpegPath} -i ${filePath} -af "silencedetect=n=${silenceThreshold}dB:d=2.0" -f null -`;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }

        const silenceStart = stderr.match(/silence_start: \d+\.\d+/g);
        const silenceEnd = stderr.match(/silence_end: \d+\.\d+/g);

        if (!silenceStart || !silenceEnd) {
            console.log('No silences found.');
            return;
        }

        let silences = [];
        var obj;

        console.log(silenceStart);
        console.log(silenceEnd);

        for (var i = 0; i < silenceStart.length && i < silenceEnd.length; i++) {
            obj = {
                start: silenceStart[i].split(' ')[1],
                end: silenceEnd[i].split(' ')[1],
                duration: silenceEnd[i].split(' ')[1] - silenceStart[i].split(' ')[1]
            };

            silences.push(obj);
        }

        callback(silences);
    });
}


function getIndex(output) {
    let filename = output.split('\\').pop();
    const regex = /desc(\d+)\.wav/;
    const match = filename.match(regex);
    const indice = match[1];
    return indice;
}

function convierteTiempo(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

ipcRenderer.on('concatenar', (event, arg) => {
    let output = path.dirname(arg.datos_fichero.ruta);
    let ruta_video = arg.datos_fichero.ruta;
    let ruta_video_output = ruta_video.replace('org_', 'mod_');
    let silencios = arg.silencios.map(silencio => {
        silencio.start = convierteTiempo(silencio.start);
        silencio.end = convierteTiempo(silencio.end);
        return silencio;
    });

    let audios = [];
    fs.readdir(output, (err, files) => {
        if (err) {
            console.log(err);
            return;
        }

        audios = files.filter(file => file.includes('.wav') && file.includes('desc'));
        audios.forEach(audio => {
            let indice = getIndex(audio);
            audio = path.join(output, audio);
            try {
                if (silencios[indice] != null || silencios[indice] != undefined) {
                    let start = silencios[indice].start;
                    let end = parseInt(silencios[indice].end.split(':')[2]);
                    let duration = silencios[indice].duration;
                    const timeInMilliseconds = duration * 1000;
                    const date = new Date(timeInMilliseconds);
                    const timeString = date.toISOString().match(/(\d{2}:\d{2}:\d{2})\.\d{3}/)[1];

                    console.log(`Inicio del silencio: ${start}`);
                    console.log(`Fin del silencio: ${end}`);
                    console.log(`Duración del silencio: ${timeString}`);

                    // ffmpeg -i video.mp4 -i snido.mp3 -ss 20 -t 40 -map 0:v:0 -map 2:a:0 -y out.mp4
                    const concatena = `${ffmpegPath} -i ${ruta_video} -i ${audio} -ss ${start} -t ${timeString} -map 0:v -map 1:a -c:v copy -c:a copy ${ruta_video_output}`;
                    exec(concatena, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        console.log('Concatenado correctamente');
                    });
                }
            }
            catch (err) {
                console.log(err);
            }
        });
    });
});