const { ipcRenderer } = require('electron');
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec, execSync } = require('child_process');

const { tiempoEnSegundos, tiempoEnMilisegundos, getIndex, sintetiza } = require('../js/base_functions.js');
module.exports = { actualizaBotones }
const fs = require('fs');

let recorder;
let audioChunks = [];
let audioBlobs = [];

let silencios = [];
var datos_audio = [];
let silenciosRenderer = [];

ipcRenderer.removeAllListeners('actualizar_silencios');
ipcRenderer.once('actualizar_silencios', (event, arg) => {
    datos_audio = arg;
    silenciosRenderer = arg.silencios;
    actualizaBotones();
});

function actualizaBotones() {
    let btnsPlay = document.querySelectorAll('.btnPlay');
    let btnsGrabar = document.querySelectorAll('.btnGrabar');
    let btnsParar = document.querySelectorAll('.btnParar');

    btnsPlay.forEach(btn => {
        btn.removeEventListener('click', sintetiza, false);
        btn.addEventListener('click', function (event) { sintetiza(event, voz) }, false);
    });

    btnsGrabar.forEach(btn => {
        btn.removeEventListener('click', grabarVoz, false);
        btn.addEventListener('click', grabarVoz, false);
    });

    btnsParar.forEach(btn => {
        btn.removeEventListener('click', pararVoz, false);
        btn.addEventListener('click', pararVoz, false);
    });
}

ipcRenderer.removeAllListeners('cambiar_archivo_grabacion');
ipcRenderer.on('cambiar_archivo_grabacion', (event, arg) => {
    datos_audio = arg;
    silenciosRenderer = arg.silencios;
    actualizaBotones();
});

let btnGrabarApretado = null;
function grabarVoz(event) {
    let btn = event.currentTarget;
    btnGrabarApretado = btn;
    audioChunks = [];
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            recorder = new MediaRecorder(stream);
            recorder.start();
            console.log('Grabando...');
            btn.classList.toggle('botonR');
            btn.classList.toggle('botonR_i');
        });
}

function actualizaEstado(estado, buffer, id) {
    let tr = document.querySelector(`.${id}`);
    let td = tr.querySelector('.input');
    let span = td.querySelector('span');
    let btnPlay = span.querySelector('.btnPlay');

    if (buffer != null) {
        const context = new AudioContext();
        let source = context.createBufferSource();

        btnPlay.addEventListener('click', () => {
            if (buffer) {
                source.buffer = buffer;
                source.connect(context.destination);
                source.start();
            }
            source = null;
        });
    }

    let existeComp = tr.querySelector('.comprobacion');
    if (existeComp != null) {
        let label = existeComp.querySelector('label');
        label.innerHTML = estado ? '🟢' : '🔴';

    }
    else {
        // Creo el estado
        let newTd = document.createElement('td');
        newTd.className = 'comprobacion';

        let label = document.createElement('label');
        label.innerHTML = estado ? '🟢' : '🔴';
        newTd.appendChild(label);

        tr.appendChild(newTd);
    }
}

function pararVoz(event) {
    let btn = event.currentTarget;

    if (btnGrabarApretado == null) {
        return;
    }
    // Si el botón de parar y grabar es el mismo
    if (btnGrabarApretado.id.split('_')[0] == btn.id.split('_')[0]) {
        recorder.stop();
        // console.log('Parando...');
        let output = datos_audio.audio_extraido.split('org')[0] + btn.id.split("_")[0] + '.blob';

        recorder.ondataavailable = async e => {
            btnGrabarApretado.classList.toggle('botonR');
            btnGrabarApretado.classList.toggle('botonR_i');
            audioChunks.push(e.data);
            if (recorder.state == 'inactive') {
                let blob = new Blob(audioChunks, { type: 'audio/wav' });
                let result = await compruebaSilencios(output, blob);
                let estado = result[0];
                let buffer = result[1];
                actualizaEstado(estado, buffer, btn.id.split('_')[0]);
                audioBlobs.push([blob, output, estado]);
            }
        }
    }
    else {
        // console.log('Botones incorrectos');
        return;
    }
}
// New-Alias -Name ns -Value C:\Users\francip\Desktop\Repos\AutoDescripcion\script.ps1
// New-Alias -Name ns -Value C:\Users\panch\Desktop\TFG\AutoDescripcion\script.ps1

function createAudioBuffer(blob) {
    return new Promise((resolve, reject) => {
        const context = new AudioContext();
        const reader = new FileReader();
        reader.onload = () => {
            context.decodeAudioData(reader.result).then(buffer => {
                resolve(buffer);
            }).catch(err => {
                reject(err);
            });
        };
        reader.readAsArrayBuffer(blob);
    });
}
// True si es mayor
// False si es menor
async function compruebaSilencios(output, blob) {
    const indice = getIndex(output);
    let silenceDuration;

    silenceDuration = silenciosRenderer[indice].duration;

    try {
        const audioBuffer = await createAudioBuffer(blob);
        return [audioBuffer.duration > silenceDuration ? false : true, audioBuffer];
    }
    catch (err) {
        console.log(err);
    }
}

function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

function checkFile(output) {
    if (fs.existsSync(output)) {
        fs.unlinkSync(output);
        // console.log(`-- Borrado ${output} --`);
    }
    else {
        // console.log(`-- Creando ${output} --`);
    }
}

function compruebaExistente(output) {
    try {
        checkFile(output);
        checkFile(output.replace('.blob', '.mp3'));
    }
    catch (err) {
        console.log(err);
    }
}

function creaWav(output, arrayBuffer) {
    return new Promise((resolve, reject) => {
        fs.writeFile(output, Buffer.from(arrayBuffer), (err) => {
            if (err) reject(err);
            else {
                const convertWAV = `${ffmpegPath} -i ${output} ${output.split('.blob')[0]}.mp3`;
                exec(convertWAV, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    } else {
                        console.log(`-- Creado ${output.split('.blob')[0]}.mp3 --`);
                        resolve();
                    }
                });
            }
        });
    });
}

async function almacenaWav(blob, output) {
    try {
        const arrayBuffer = await blobToArrayBuffer(blob);
        compruebaExistente(output);
        await creaWav(output, arrayBuffer);
    }
    catch (err) {
        console.log(err);
    }
}

function obtenerDuracionBlob(blob) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            const duracion = audio.duration;
            audio.remove(); // Elimina el elemento de audio para liberar recursos
            resolve(duracion);
        });
        audio.addEventListener('error', () => {
            reject('No se pudo obtener la duración del archivo Blob.');
        });
    });
}

async function concatena(audios, arg) {
    console.log(arg);
    let almacenado = true;
    let ruta_video = arg.datos_audio.ruta_org;
    let ruta_video_output = ruta_video.replace('org_', 'mod_');

    let silencios = arg.silenciosRenderer;

    let inputs = '';
    let filter = '';
    let preFiltro = '';

    let data = [];
    data.actuales = [];

    for (let i = 0; i < audios.length; i++) {
        let audio = audios[i][1];
        // let duracion = await obtenerDuracionBlob(audios[i][0]);
        let indice = getIndex(audio);

        let start = silencios.find(elem => elem.index == indice).start;
        let end = silencios.find(elem => elem.index == indice).end;
        let startM = tiempoEnMilisegundos(start);

        data.actuales.push([audio.replace('.blob', '.mp3'), start, end]);

        // Empiezo a crear el comando
        inputs += ` -i ${audio.replace('.blob', '.mp3')}`;
        // Empiezo con el filtro
        if (startM > 0) {
            filter += `[${i + 1}:a]adelay=${startM}|${startM},volume=2[a${i + 1}];`;
        } else {
            filter += `[${i + 1}:a]adelay=500|500,volume=2[a${i + 1}];`;
        }

        // Flags adicionales
        preFiltro += `[a${i + 1}]`;
    }

    filter += `[0:a]${preFiltro}amix=inputs=${audios.length + 1}[a]`;

    let command = `${ffmpegPath} -i ${ruta_video} ${inputs} -filter_complex "${filter}" -map 0:v -map [a] -c:v copy -c:a aac -strict experimental -y ${ruta_video_output}`;

    data.datos_audio = datos_audio;
    data.ruta_mod = ruta_video_output;

    console.log(command);

    try {
        const stdout = execSync(command);
        console.log(data);
        ipcRenderer.send('video_concatenado', data);
    } catch (error) {
        console.error(error);
    }
}

ipcRenderer.removeAllListeners('concatenar_grabacion');
ipcRenderer.once('concatenar_grabacion', async (event, arg) => {
    try {
        // if (audioBlobs.length == 0) {
        //     Swal.fire({
        //         title: '¡Atención!',
        //         text: 'No hay grabaciones para enviar.',
        //         icon: 'warning',
        //         showCancelButton: false,
        //         confirmButtonText: 'Aceptar',
        //         cancelButtonText: 'Cancelar'
        //     });
        //     return;
        // }
        var i = 0;
        for (i = 0; i < audioBlobs.length; i++) {
            let data = audioBlobs[i];
            let blob = data[0];
            let output = data[1];
            let estado = data[2];

            let aux = output.substring(output.lastIndexOf('\\') + 1);

            // console.log(`--- Procesando ${aux} ---`);
            if (estado == false) {
                const result = await Swal.fire({
                    title: '¡Atención!',
                    text: 'Hay grabaciones que superan el tiempo de silencio. ¿Desea enviarlas de todas formas?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Enviar',
                    cancelButtonText: 'Cancelar'
                });

                if (!result.value) {
                    continue;
                }
            }

            try {
                await almacenaWav(blob, output);
            } catch (error) {
                console.error(error);
            }
        }
        await concatena(audioBlobs, arg);
    }
    catch (err) {
        console.log(err);
        // console.log(arg.datos_audio.vuelto);
        // if (arg.datos_audio.vuelto == undefined) {
        //     Swal.fire({
        //         title: '¡Error!',
        //         text: 'Se ha producido un error al procesar las grabaciones. Por favor, inténtalo de nuevo más tarde.',
        //         icon: 'error',
        //         showCancelButton: false,
        //         confirmButtonText: 'Aceptar',
        //         cancelButtonText: 'Cancelar'
        //     });
        // }
    }
});