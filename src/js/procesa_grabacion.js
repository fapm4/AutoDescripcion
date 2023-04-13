let recorder;
let audioChunks = [];
let audioBlobs = [];

ipcRenderer.on('cambiar_archivo', (event, arg) => {
    let silencios = arg.silencios;
    let datos_fichero = arg.datos_fichero;
    // Obtengo los botones para añadir los eventos
    const btnsGrabar = document.querySelectorAll('.btnGrabar');
    const btnsParar = document.querySelectorAll('.btnParar');
    // Añado los eventos a los botones
    btnsGrabar.forEach(btn => {
        btn.addEventListener('click', function (event) { grabarVoz(event, silencios, datos_fichero) }, false);
    });

    btnsParar.forEach(btn => {
        btn.addEventListener('click', function (event) { pararVoz(event, silencios, datos_fichero) }, false);
    });

    let btnEnviar = document.querySelector('#btnEnviar');

    btnEnviar.addEventListener('click', function (event) { comprobarGrabaciones(event, silencios, datos_fichero) }, false);
});

// Lista mental
// 1. Empezar la grabación
// 2. Parar la grabación

let btnGrabarApretado = null;
function grabarVoz(event, silencios, datos_fichero) {
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

function pararVoz(event, silencios, datos_fichero) {
    let btn = event.currentTarget;

    // Si no se ha dado a grabar, no hago nada
    if (btnGrabarApretado == null) {
        console.log('Apreta un botón de grabar primero');
        return;
    }
    // Si el botón de parar y grabar es el mismo
    if (btnGrabarApretado.id.split('_')[0] == btn.id.split('_')[0]) {
        console.log('Parando...');
        btnGrabarApretado.classList.toggle('botonR');
        btnGrabarApretado.classList.toggle('botonR_i');
        let output = datos_fichero.output.split('org')[0] + btn.id.split("_")[0] + '.blob'
        recorder.stop();
        recorder.ondataavailable = e => {
            audioChunks.push(e.data);
            if (recorder.state == 'inactive') {
                let blob = new Blob(audioChunks, { type: 'audio/wav' });
                audioBlobs.push([blob, output]);
                audioChunks = [];
            }
        }
    }
    else {
        console.log('Botones incorrectos');
        return;
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

function comprobarGrabaciones(event, silencios, datos_fichero) {
    let btn = event.currentTarget;
    let id = btn.id;

    audioBlobs.forEach(data => {
        let blob = data[0];
        let output = data[1];

        // Añadir comprobación de silencios

        blobToArrayBuffer(blob).then(arrayBuffer => {
            fs.writeFile(output, Buffer.from(arrayBuffer), (err) => {
                if (err) console.log(err);
                else {
                    const convertWAV = `${ffmpegPath} -i ${output} ${output.split('.blob')[0]}.wav`;
                    exec(convertWAV, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        else {
                            const deleteBlob = `del ${output}`;
                            exec(deleteBlob, (err, stdout, stderr) => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                                else{
                                    // Añadir comprobación de silencios
                                    console.log('Comprobando silencios...');

                                }
                            });
                        }
                    });
                }
            });
        });
    });
}