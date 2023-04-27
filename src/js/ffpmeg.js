var ipcRenderer = require('electron').ipcRenderer;
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path')
const { exec } = require('child_process');


// 4.2 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.once('busca_silencios', (event, arg) => {
    // Comienzo a procesar el fichero
    console.log('Procesando fichero...');
    console.log(arg);

    let nombreFichero = arg.ruta.split('\\').pop().split('.')[0];
    // Mi PC
    const output = `C:\\Users\\panch\\Desktop\\TFG\\AutoDescripcion\\src\\contenido\\${nombreFichero.substring(4, nombreFichero.length)}\\${nombreFichero}.mp3`;
    // const output = `C:\\Users\\francip\\Desktop\\Repos\\AutoDescripcion\\src\\contenido\\${nombreFichero.substring(4, nombreFichero.length)}\\${nombreFichero}.mp3`;
    let ruta = arg.ruta;
    let media_name = arg.media_name;
    let modo = arg.modo;

    // 6. Mando un evento para mostrar la pantalla de carga - Por hacer
    let datos_fichero = {
        output,
        ruta,
        media_name,
        modo
    }

    let obj = {};
    let voice = arg.idioma;
    ffmpeg(ruta)
        .output(output)
        .noVideo()
        .audioCodec('libmp3lame')
        .on('end', () => {
            threshold_value = arg.threshold_value;
            console.log('Threshold antes: ', threshold_value);
            if (threshold_value == null) {
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
                        threshold_value = parseFloat(matchValue[0]);
                        
                        getIntervals(output, threshold_value, (silencios) => {
                            obj = {
                                datos_fichero,
                                silencios,
                                voice
                            };
    
                            // 7. Silencios detectados, enviamos evento para  cargar la pantalla del formulario
                            // para añadir el texto
                            ipcRenderer.send('audio_analizado', obj);
                        });
                        
                    }
                });
            }
    
            getIntervals(output, threshold_value, (silencios) => {
                obj = {
                    datos_fichero,
                    silencios,
                    voz
                };

                // 7. Silencios detectados, enviamos evento para  cargar la pantalla del formulario
                // para añadir el texto
                ipcRenderer.send('audio_analizado', obj);
            });
        })
        .on('error', (err) => {
            console.log('Error al separar el audio:', err.message);
        })
        .run();
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

        let silences = [];
        var obj;

        if (!silenceStart || !silenceEnd) {
            console.log('No silences found.');
            callback(silences);
        }

        for (var i = 0; i < silenceStart.length && i < silenceEnd.length; i++) {
            let start = convierteTiempo(silenceStart[i].split(' ')[1]);
            let end = convierteTiempo(silenceEnd[i].split(' ')[1]);
            let duration = (silenceEnd[i].split(' ')[1] - silenceStart[i].split(' ')[1]).toFixed(1);
            obj = {
                start,
                end,
                duration
            };

            silences.push(obj);
        }
        callback(silences);
    });
}

function getMeanLoudness() {

}