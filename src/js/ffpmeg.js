var ipcRenderer = require('electron').ipcRenderer;

const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');


ipcRenderer.on('procesa-check', (event, arg) => {
    if (arg == undefined) {
        alert('No has seleccionado ningún fi2qchero');
    }
    else {
        ipcRenderer.send('procesando', 'Procesando fichero...');
        console.log('Procesando fichero...');

        let file = arg.ruta.split('/').pop().split('.')[0];
        const output = `/home/fapm4/Escritorio/AutoDescripcion/src/audios/${file}.wav`;

        ffmpeg(arg.ruta)
            .output(output)
            .noVideo()
            .audioCodec('pcm_s16le')
            .audioChannels(1)
            .on('end', () => {
                console.log('Audio extraído correctamente');
                getIntervals(output, '-30', (silences) => {
                    console.log(`Se encontraron ${silences.length} silencios.`);
                    console.log('Silencios: ', silences)
                })
            })
            .run();
    }
});

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

        for (var i = 0; i < silenceStart.length; i++) {
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