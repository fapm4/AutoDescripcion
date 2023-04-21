const { spawn } = require('child_process');

let recorder;
let audioChunks = [];
let audioBlobs = [];

let silencios = [];
var datos_fichero = [];

function añadirBotonesControl(etiqueta){
    const btnsGrabar = etiqueta.querySelectorAll('.btnGrabar');
    const btnsParar = etiqueta.querySelectorAll('.btnParar');
    // Añado los eventos a los botones
    btnsGrabar.forEach(btn => {
        btn.addEventListener('click', function (event) { grabarVoz(event) }, false);
    });

    btnsParar.forEach(btn => {
        btn.addEventListener('click', function (event) { pararVoz(event) }, false);
    });

    let btnEnviar = document.querySelector('#btnEnviar');

    btnEnviar.addEventListener('click', function (event) { comprobarGrabaciones(event) }, false);
}

ipcRenderer.on('cambiar_archivo', (event, arg) => {
    silencios = arg.silencios;
    datos_fichero = arg.datos_fichero;
    // Obtengo los botones para añadir los eventos
    añadirBotonesControl(document);
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
        recorder.stop();
        console.log('Parando...');
        let output = datos_fichero.output.split('org')[0] + btn.id.split("_")[0] + '.blob';
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
async function compruebaSilencios(output, blob) {
    const indice = getIndex(output);
    console.log(silencios);
    const silenceDuration = silencios[indice].duration;

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


function tiempoEnMilisegundos(tiempo) {
    let partes = tiempo.split(':');
    let horas = parseInt(partes[0]);
    let minutos = parseInt(partes[1]);
    let segundos = parseInt(partes[2]);

    return (horas * 3600 + minutos * 60 + segundos) * 1000;
}

function tiempoEnSegundos(tiempo) {
    var partes = tiempo.split(":");
    var horas = parseInt(partes[0]);
    var minutos = parseInt(partes[1]);
    var segundos = parseInt(partes[2]);
  
    return horas * 3600 + minutos * 60 + segundos;
  }

function concatena(audios) {
    let ruta_video = datos_fichero.ruta;
    let ruta_video_output = ruta_video.replace('org_', 'mod_');

    let inputs = '';
    let filter = '';
    let preFiltro = '';

    let inputsToResolve = [];
    let silencesToResolve = [];

    for (let i = 0; i < audios.length; i++) {
        // Obtengo el indice para saber el silencio
        let indice = getIndex(audios[i][1]);
        let start = tiempoEnMilisegundos(silencios[indice].start);

        // Empiezo a crear el comando
        inputs += ` -i ${audios[i][1].replace('.blob', '.mp3')}`;
        // Empiezo con el filtro
        filter += `[${i + 1}:a]adelay=${start}|${start}[a${i + 1}];`;

        // Flags adicionales
        preFiltro += `[a${i + 1}]`;
    }

    filter += `[0:a]${preFiltro}amix=inputs=${audios.length + 1}[a]`;

    let command = `${ffmpegPath} -i ${ruta_video} ${inputs} -filter_complex "${filter}" -map 0:v -map [a] -c:v copy -c:a aac -strict experimental -y ${ruta_video_output}`;
    
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            } else {
                resolve();
            }
        });
    });
}

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
            } catch (error) {
                console.error(error);
            }
        }

        await concatena(audioBlobs).then(() => {
            console.log('-------------------------------------------');
            crearWebvtt();
        });
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