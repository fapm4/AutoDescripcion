const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');
const { spawn } = require('child_process');

let recorder;
let audioChunks = [];
let audioBlobs = [];

var silencios = [];
var datos_fichero = [];

ipcRenderer.on('cambiar_archivo', (event, arg) => {
    silencios = arg.silencios;
    datos_fichero = arg.datos_fichero;
    // Obtengo los botones para añadir los eventos
    const btnsGrabar = document.querySelectorAll('.btnGrabar');
    const btnsParar = document.querySelectorAll('.btnParar');
    // Añado los eventos a los botones
    btnsGrabar.forEach(btn => {
        btn.addEventListener('click', function (event) { grabarVoz(event) }, false);
    });

    btnsParar.forEach(btn => {
        btn.addEventListener('click', function (event) { pararVoz(event) }, false);
    });

    let btnEnviar = document.querySelector('#btnEnviar');

    btnEnviar.addEventListener('click', function (event) { comprobarGrabaciones(event) }, false);
});

let btnGrabarApretado = null;
function grabarVoz(event) {
    let btn = event.currentTarget;

    btnGrabarApretado = btn;

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            recorder = new MediaRecorder(stream);
            recorder.start();
            console.log('Grabando...');
            btn.classList.toggle('botonR');
            btn.classList.toggle('botonR_i');
        });
}

function reproducirAudio(buffer) {
    const context = new AudioContext();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
}

function actualizaEstado(estado, buffer, id) {
    console.log(estado, buffer, id);
    let tr = document.querySelector(`.${id}`);
    let td = tr.querySelector('.input');
    let span = td.querySelector('span');
    let btnPlay = span.querySelector('.btnPlay');

    // Añado la reproducción
    btnPlay.addEventListener('click', () => reproducirAudio(buffer), false);

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

    // Si no se ha dado a grabar, no hago nada
    if (btnGrabarApretado == null) {
        console.log('Apreta un botón de grabar primero');
        return;
    }
    // Si el botón de parar y grabar es el mismo
    if (btnGrabarApretado.id.split('_')[0] == btn.id.split('_')[0]) {
        console.log('Parando...');
        let output = datos_fichero.output.split('org')[0] + btn.id.split("_")[0] + '.blob'
        recorder.stop();
        recorder.ondataavailable = e => {
            btnGrabarApretado.classList.toggle('botonR');
            btnGrabarApretado.classList.toggle('botonR_i');
            audioChunks.push(e.data);
            if (recorder.state == 'inactive') {
                let blob = new Blob(audioChunks, { type: 'audio/wav' });
                audioBlobs.push([blob, output]);
                audioChunks = [];
                compruebaSilencios(output, blob).then(result => {
                    let estado = result[0];
                    let buffer = result[1];
                    audioBlobs.push([blob, output, estado]);
                    actualizaEstado(estado, buffer, btn.id.split('_')[0]);
                });
            }
        }
    }
    else {
        console.log('Botones incorrectos');
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

function getIndex(output) {
    let filename = output.split('\\').pop();
    const regex = /desc(\d+)\./;
    const match = filename.match(regex);
    const indice = match[1];
    return indice;
}


// True si es mayor
// False si es menor
function compruebaSilencios(output, blob) {
    return new Promise((resolve, reject) => {
        const indice = getIndex(output)
        const silenceDuration = silencios[indice].duration;
        createAudioBuffer(blob)
            .then(audioBuffer => {
                resolve([audioBuffer.duration > silenceDuration ? false : true, audioBuffer]);
            })
            .catch(err => console.log(err));
    });
}

function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

function compruebaExistente(output) {
    return new Promise((resolve, reject) => {
        try {
            const exists = `del ${output} ${output.split('.blob')[0]}.wav}`;
            exec(exists, (err, stdout, stderr) => {
                resolve();
            });
        }
        catch (err) {
            resolve();
        }
    });
}

function creaWav(output, arrayBuffer) {
    return new Promise((resolve, reject) => {
        fs.writeFile(output, Buffer.from(arrayBuffer), (err) => {
            if (err) reject(err);
            else {
                const convertWAV = `${ffmpegPath} -i ${output} ${output.split('.blob')[0]}.wav`;
                exec(convertWAV, (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

function almacenaWav(blob, output) {
    return new Promise((resolve, reject) => {
        blobToArrayBuffer(blob)
            .then(arrayBuffer => {
                compruebaExistente(output)
                    .then(() => {
                        creaWav(output, arrayBuffer)
                            .then(() => {
                                resolve();
                                // Borrar más adelante
                                // const deleteBlob = `del ${output}`;
                                // console.log('Borrando blob...');
                                // console.log(deleteBlob);
                                // exec(deleteBlob, (err, stdout, stderr) => {
                                //     if (err) {
                                //         console.error(err);
                                //         return;
                                //     }
                                //     else {
                                //         resolve();
                                //     }
                                // });
                            })
                    });
            })
            .catch(err => console.log(err));
    });
}

function convierteTiempo(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

function tiempoEnMilisegundos(tiempo) {
    let partes = tiempo.split(':');
    let horas = parseInt(partes[0]);
    let minutos = parseInt(partes[1]);
    let segundos = parseInt(partes[2]);

    return (horas * 3600 + minutos * 60 + segundos) * 1000;
}

let concatenando = false;
async function concatena(audio_path) {

    while (concatenando) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    concatenando = true;

    let ruta_video = datos_fichero.ruta;
    let ruta_video_output = ruta_video.replace('org_', 'mod_');
    let audio = audio_path.replace('blob', 'wav');
    console.log("Audio: ", audio);

    let indice = getIndex(audio);

    if (indice != 0) {
        ruta_video = ruta_video_output;
    }
    else {
        console.log('TU PUTA MADRE');
    }

    try {
        let start = tiempoEnMilisegundos(convierteTiempo(silencios[indice].start));
        console.log('Procesando audio: ', audio);
        console.log('Ruta video: ', ruta_video);
        console.log('Ruta video output: ', ruta_video_output);

        const concatena = `${ffmpegPath} -i ${ruta_video} -i ${audio} -filter_complex "[1:a]adelay=${start}|${start}[a1];[0:a][a1]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -strict experimental -shortest ${ruta_video_output}`;
        console.log(concatena);
        await new Promise((resolve, reject) => {
            exec(concatena, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    console.log('Audio concatenado correctamente.');
                    resolve();
                }
            });
        });

        concatenando = false;
    }
    catch (err) {
        console.log(err);
    }
}

async function comprobarGrabaciones(event) {
    let btn = event.currentTarget;
    let id = btn.id;

    if (audioBlobs.length == 0) {
        Swal.fire({
            title: '¡Atención!',
            text: 'No hay grabaciones para enviar.',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        });
        return;
    }

    setTimeout(1000);
    audioBlobs = audioBlobs.filter(array => array.length === 3);

    const promesas = audioBlobs.map(data => {
        let blob = data[0];
        let output = data[1];
        let estado = data[2];

        if (estado == false) {
            const result = Swal.fire({
                title: '¡Atención!',
                text: 'Hay grabaciones que superan el tiempo de silencio. ¿Desea enviarlas de todas formas?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Enviar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.value) {
                return Promise.resolve();
            }
        }

        return almacenaWav(blob, output).then(() => concatena(output));
    });

    await Promise.all(promesas);
}

