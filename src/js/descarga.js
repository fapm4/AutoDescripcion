const  { ipcRenderer } = require('electron');

function volver_a_formulario(args) {
    console.log(args);
    ipcRenderer.send('volver_a_formulario', args);
}

let contador = 0;
ipcRenderer.on('pagina_descarga_cargada', (event, arg) => {
    // arg[1] es el video modificado y arg[0] los audios con los silencios para el webvtt
    let args = arg;

    let video = document.querySelector('.custom-player');
    video.remove();

    let nuevoVideo = document.createElement('video');
    nuevoVideo.className = "custom-player";
    let videoSrc = arg.ruta_mod;

    if (nuevoVideo != undefined) {
        nuevoVideo.src = videoSrc;
    }

    nuevoVideo.controls = true;

    console.log(args);

    document.querySelector('.reproductor').appendChild(nuevoVideo);

    let bloque = document.querySelector('.bloquePrincipal');

    let span = document.createElement('span');
    span.className = "botonesVoz";
    span.id = "botonesDescarga";

    let btnDescargarVideo = document.createElement('button');
    btnDescargarVideo.className = "boton botonR";
    btnDescargarVideo.innerHTML = "Descargar video";
    btnDescargarVideo.addEventListener('click', () => ipcRenderer.send('descarga_contenido', videoSrc), true);


    let btnDescargarWebVTT = document.createElement('button');
    btnDescargarWebVTT.className = "boton botonR";
    btnDescargarWebVTT.innerHTML = "Descargar WEBVTT";
    btnDescargarWebVTT.addEventListener('click', () => generaWebVTT(arg.slice(0, arg.length - 1)), true);

    let btnVolver = document.createElement('button');
    btnVolver.className = "boton botonR";
    btnVolver.innerHTML = "Volver";

    btnVolver.addEventListener('click', () => { args.volver = true; volver_a_formulario(args)}, true);

    if (args.volver == undefined && contador == 0) {
        span.appendChild(btnDescargarVideo);
        span.appendChild(btnDescargarWebVTT);
        span.appendChild(btnVolver);
        bloque.appendChild(span);

        contador += 1;
    }
});