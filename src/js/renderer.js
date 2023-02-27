const { webContents, dialog} = require('electron');

var ipcRenderer = require('electron').ipcRenderer;

const remote = require('@electron/remote');
const main = remote.require('./main');
let modo = document.querySelectorAll('input[name=modo]:checked');


const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');


ipcRenderer.on('cargaFinalizada', (event, arg) => {
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
    });
});

function redirige(event){
    
    const currentTarget = event.currentTarget;
    let ruta;

    switch(currentTarget.id){
        case 'btnInicio':
            ruta = 'index.html';
            break;
        case 'btnInfo':
            ruta = 'info.html';
            break;
        case 'btnDescr':
            ruta = 'sube_ficheros.html';
            break;
        default:
            prompt('Error');
    };

    ipcRenderer.send('redirige', ruta);
}

ipcRenderer.on('redireccionFinalizada', (event, arg) => {
    const botonS = document.querySelector('.botonS');
    botonS.addEventListener('click', () => ipcRenderer.send('requestFile'), true);

    let botonR = document.querySelector('.botonR');
    botonR.addEventListener('click', () => ipcRenderer.send('procesa'), true);
});

ipcRenderer.on('procesa-check', (event, arg) => {
    if(arg == undefined){
        alert('No has seleccionado ningún fichero');
    }
    else{
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
            getIntervals(output, '-20', (silences) => {
                console.log(`Se encontraron ${silences.length} silencios.`);
                console.log('Silenciones: ', silences)
                console.log(`Duraciones de los silencios: ${silences.join(', ')}`);
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
      
      const silenceMatches = stderr.match(/silence_start: \d+\.\d+/g);
      if (!silenceMatches) {
        console.log('No silences found.');
        return;
      }
      
      const silences = silenceMatches.map(match => parseFloat(match.split(' ')[1]));
      callback(silences);
    });
  }

ipcRenderer.on('not-file-found', (event, arg) => {
    alert('No se ha encontrado el fichero');
});

ipcRenderer.on('actualiza-label', (event, arg) => {
    let label = document.querySelector('#fileName');
    label.innerHTML = arg;
});

ipcRenderer.on('fichero_subido', (event, arg) => {
    console.log('Fichero subido correctamente a la BBDD');
});
