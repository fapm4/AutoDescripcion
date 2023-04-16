const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');
const { get } = require('https');

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
    const regex = /desc(\d+)\.blob/;
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
    let obj = {
        datos_fichero,
        silencios,
    };
    
    return new Promise((resolve, reject) => {
        blobToArrayBuffer(blob)
            .then(arrayBuffer => {
                compruebaExistente(output)
                    .then(() => {
                        creaWav(output, arrayBuffer)
                            .then(() => {
                                ipcRenderer.send('listo_para_concatenar', obj);
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

function comprobarGrabaciones(event) {
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

    audioBlobs.forEach(data => {
        let blob = data[0];
        let output = data[1];
        let estado = data[2];

        if (estado == false) {
            Swal.fire({
                title: '¡Atención!',
                text: 'Hay grabaciones que superan el tiempo de silencio. ¿Desea enviarlas de todas formas?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Enviar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.value) {
                    almacenaWav(blob, output);
                }
                else {
                    return;
                }
            });
        }
        else {
            almacenaWav(blob, output);
        }
    });
}

module.exports = getIndex;