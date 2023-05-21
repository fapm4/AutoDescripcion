ipcRenderer.once('pagina_descarga_cargada', (event, arg) => {
    // arg[1] es el video modificado y arg[0] los audios con los silencios para el webvtt
    let videoSrc = arg.datos_audio.ruta_org.replace('org_', 'mod_');
    let args = arg;
    args.volver = true;


    let bloque = document.querySelector('.bloquePrincipal');

    let video = document.querySelector('video');
    if (video != undefined) {
        video.src = videoSrc;
    }

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
    btnVolver.addEventListener('click', () => { ipcRenderer.send('volver_a_formulario', args) }, true);

    span.appendChild(btnDescargarVideo);
    span.appendChild(btnDescargarWebVTT);
    span.appendChild(btnVolver);
    bloque.appendChild(span);
});