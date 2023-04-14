var ipcRenderer = require('electron').ipcRenderer;

const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
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
        // const output = `C:\\Users\\panch\\Desktop\\TFG\\AutoDescripcion\\src\\contenido\\${file.substring(4, file.length)}\\${file}.wav`;
        const output = `C:\\Users\\francip\\Desktop\\Repos\\AutoDescripcion\\src\\contenido\\${file.substring(4, file.length)}\\${file}.wav`;
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

ipcRenderer.on('concatenar', (event, arg) => {
    console.log(arg);
});