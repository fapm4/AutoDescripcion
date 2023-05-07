let audiosGenerados = [];

ipcRenderer.on('cambiar_archivo_sintesis', async (event, arg) => {
    silencios = arg.silenciosRenderer;
    datos_fichero = arg.datos_fichero;

    await preComprobacion().then(() => {
        let inputs = document.querySelectorAll(".inputSilencio");
        concatena(audiosGenerados, silencios, true, inputs)
    });
});

async function sintetiza(event) {
    let btn = event.currentTarget;
    let input = btn.previousElementSibling;
    reproducePrueba(input.value, elegidoIdioma);
}

async function preComprobacion() {
    return new Promise(async (resolve, reject) => {
        let inputs = document.querySelectorAll('.inputSilencio');
        for (let i = 0; i < inputs.length; i++) {
            let output = datos_fichero.output.split('org')[0] + inputs[i].id.split('_')[0] + '.mp3';
            audiosGenerados.push(output);
            await say.export(inputs[i].value, elegidoIdioma, 1, output, (err) => {
                if (err) {
                    return console.error(err);
                }
            });
        }

        setTimeout(2000, resolve());
    });
}