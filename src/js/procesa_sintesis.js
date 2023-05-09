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
    let inputs = document.querySelectorAll('.inputSilencio');
    for await (const input of inputs) {
        let output = datos_fichero.output.split('org')[0] + input.id.split('_')[0] + '.mp3';
        audiosGenerados.push(output);
        await say.export(input.value, elegidoIdioma, 1, output, (err) => {
            if (err) {
                return console.error(err);
            }
        });
    }
}
