ipcRenderer.on('cambiar_archivo_sintesis', async (event, arg) => {
    silencios = arg.silenciosRenderer;
    datos_fichero = arg.datos_fichero;

    await preComprobacion().then(() => console.log('procesados silencios'));
});

async function sintetiza(event) {
    let btn = event.currentTarget;
    let input = btn.previousElementSibling;
    await creaBlob(input, false);
}

async function creaBlob(input, almacena){
    let voice = voices.filter(voice => voice.name == voiceSynth)[0];
    let ttsRecorder = new SpeechSynthesisRecorder({
        text: input.value,
        utteranceOptions: {
            voice: voice,
            rate: 1,
            pitch: 1,
            volume: almacena ? 0 : 1
        }
    });

    await ttsRecorder.start()
        .then(tts => tts.blob())
        .then(async ({ tts, data }) => {
            let output_blob = datos_fichero.output.split('org')[0] + input.id.split('_')[0] + '.blob';
            let result = await compruebaSilencios(output_blob, data);
            let estado = result[0];
            let buffer = result[1];
            actualizaEstado(estado, null, input.id.split('_')[0]);
            if(almacena){
                audioBlobs.push(data, output_blob, estado);
            }
        });
}

async function preComprobacion(){
    return new Promise(async (resolve, reject) => {
        let inputs = document.querySelectorAll('.inputSilencio');
        for(let i = 0; i < inputs.length; i++){
            await creaBlob(inputs[i], true);
            if(i == inputs.length - 1){
                resolve();
            }
        }
    });
}