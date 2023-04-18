const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { exec } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');

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

async function pararVoz(event) {
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
        recorder.ondataavailable = async e => {
            btnGrabarApretado.classList.toggle('botonR');
            btnGrabarApretado.classList.toggle('botonR_i');
            audioChunks.push(e.data);
            if (recorder.state == 'inactive') {
                let blob = new Blob(audioChunks, { type: 'audio/wav' });
                audioBlobs.push([blob, output]);
                audioChunks = [];
                await compruebaSilencios(output, blob).then(result => {
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

window.addEventListener('load', function () {
    const cmd = 'del .\\src\\contenido\\IMG_5721\\desc.*';
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
});

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

function checkFile(output) {
    if (fs.existsSync(output)) {
        fs.unlinkSync(output);
        console.log(`-- Borrado ${output} --`);
    }
    else {
        console.log(`-- Creando ${output} --`);
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

function concatena(audio_path) {
    let ruta_video = datos_fichero.ruta;
    let ruta_video_output = ruta_video.replace('org_', 'mod_');
    let audio = audio_path.replace('blob', 'mp3');

    let indice = getIndex(audio);

    if (indice != 0) {
        ruta_video = ruta_video_output;
    }



    console.log("Ruta video: " + ruta_video);
    console.log("Ruta video output: " + ruta_video_output);
    console.log("Audio: " + audio);

    let start = tiempoEnMilisegundos(convierteTiempo(silencios[indice].start));

    const args = [
        '-i', ruta_video,
        '-i', audio,
        '-filter_complex', `[1:a]adelay=${start}|${start}[a1];[0:a][a1]amix=inputs=2[a]`,
        '-y',
        ,'loglevel verbose',
        '-map', '0:v',
        '-map', '[a]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-strict', 'experimental',
        '-shortest', ruta_video_output
    ];

    const ffmpeg = spawn(ffmpegPath, args);

    return new Promise((resolve, reject) => {
        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                console.error(`ffmpeg process exited with code ${code}`);
                reject(`ffmpeg process exited with code ${code}`);
            } else {
                console.log(`-- ${audio} concatenado con ${ruta_video} --`);
                resolve();
            }
        });
    });

    // const concatena = `${ffmpegPath} -i ${ruta_video} -i ${audio} -filter_complex "[1:a]adelay=${start}|${start}[a1];[0:a][a1]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -strict experimental -shortest ${ruta_video_output}`;
    // console.log(concatena);
    // return new Promise((resolve, reject) => {
    //     exec(concatena, (err, stdout, stderr) => {
    //         if (err) {
    //             console.error(err);
    //             reject(err);
    //         }
    //         else {
    //             console.log(`-- ${audio} concatenado con ${ruta_video} --`)
    //             resolve();
    //         }
    //     });
    // });
}

// async function concatena() {
//     return new Promise(async (resolve, reject) => {
//         let carpeta = path.dirname(datos_fichero.ruta);
//         let output_path = datos_fichero.output.replace('org_', 'mod_');
//         let source_path = datos_fichero.ruta;

//         let archivosWav = [];
//         fs.readdir(carpeta, (err, files) => {
//             archivosWav = files.filter(f => f.includes('.wav') && f.startsWith('desc'));
//             if (archivosWav != null && archivosWav.length > 0) {
//                 archivosWav.forEach(wav => {
//                     let ruta_wav = `${carpeta}\\${wav}`;
//                     let indice = getIndex(ruta_wav);
//                     let start = tiempoEnMilisegundos(convierteTiempo(silencios[indice].start));

//                     if (indice > 0) {
//                         source_path = output_path;
//                     }

//                     console.log(source_path, ruta_wav, output_path, start);
//                     const filtro = `"[1:a]adelay=${start}|${start}[a1];[0:a][a1]amix=inputs=2[a]"`;
//                     ffmpeg()
//                         .input(source_path)
//                         .input(ruta_wav)
//                         .complexFilter(filtro)
//                         .outputOptions([
//                             '-map 0:v',
//                             '-map "[a]"',
//                             '-c:v copy',
//                             '-c:a aac',
//                             '-strict experimental',
//                             '-shortest'
//                         ])
//                         .output(output_path)
//                         .on('start', (commandLine) => {
//                             console.log('Spawned Ffmpeg with command: ' + commandLine);
//                         })
//                         .on('error', (err) => {
//                             console.log('An error occurred: ' + err.message);
//                         })
//                         .on('end', () => {
//                             console.log('Processing finished !');
//                         })
//                         .run();


//                     // const concatena = `${ffmpegPath} -i ${source_path} -i ${ruta_wav} -filter_complex "[1:a]adelay=${start}|${start}[a1];[0:a][a1]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -strict experimental -shortest ${output_path}`;
//                     // console.log(concatena);
//                     // exec(concatena, (err, stdout, stderr) => {
//                     //     if (err) {
//                     //         console.error(err);
//                     //         reject(err);
//                     //     }
//                     //     else {
//                     //         resolve();
//                     //     }
//                     // });
//                 });
//             }
//         });
//     });
// }

async function comprobarGrabaciones(event) {
    try {
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

        audioBlobs = audioBlobs.filter(array => array.length === 3);
        var i = 0;

        for (i = 0; i < audioBlobs.length; i++) {
            let data = audioBlobs[i];
            let blob = data[0];
            let output = data[1];
            let estado = data[2];

            let aux = output.substring(output.lastIndexOf('\\') + 1);

            console.log(`--- Procesando ${aux} ---`);
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

                await concatena(output).then(() => {
                    console.log('--------------------------------');
                });
            } catch (error) {
                console.error(error);
            }
        }
    }
    catch (err) {
        console.log(err);
        Swal.fire({
            title: '¡Error!',
            text: 'Se ha producido un error al procesar las grabaciones. Por favor, inténtalo de nuevo más tarde.',
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        });
    }
}