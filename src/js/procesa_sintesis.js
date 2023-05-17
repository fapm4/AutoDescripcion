const say = require('say');
let audiosGenerados = [];

ipcRenderer.on('cambiar_archivo_sintesis', async (event, arg) => {
    silencios = arg.silenciosRenderer;
    datos_audio = arg.datos_audio;

    console.log(datos_audio);

    await preComprobacion().then(() => {
        let inputs = document.querySelectorAll(".inputSilencio");
        concatena(audiosGenerados, silencios, true, inputs)
    });
});

async function sintetiza(event, voz) {
    let btn = event.currentTarget;
    let input = btn.previousElementSibling;
    say.speak(input.value, voz);
}

async function preComprobacion() {
    let inputs = document.querySelectorAll('.inputSilencio');
    let promesas = [];

    for (const input of inputs) {
        if (input.value != "") {
            let output = datos_audio.audio_extraido.split('org')[0] + input.id.split('_')[0] + '.mp3';
            audiosGenerados.push(output);

            let promesa = new Promise((resolve, reject) => {
                say.export(input.value, datos_audio.voz, 1, output, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });

            });

            promesas.push(promesa);
        }
    }

    return Promise.all(promesas);
}

function actualizaTiempo(event) {
    let tecla = event.key;

    if (tecla == 'Enter') {
        let plataforma = process.platform;
        let duracion = 0;
        const velocidad = plataforma === 'darwin' ? 175 : 100;
        let texto = event.currentTarget.value;

        say.speak(texto, elegidoIdioma, velocidad, { volume: 0.0 }, (err) => {
            if (err) {
                console.log(err);
            }
            else {
                duracion = Math.ceil(texto.length / velocidad) * 1000;
            }
        });
    }
}