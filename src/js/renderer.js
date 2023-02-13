var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('cargaFinalizada', (event, arg) => {
    console.log(event)
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
        console.log(boton);
    });
});

function redirige(event){
    
    const currentTarget = event.currentTarget;
    let ruta;

    switch(currentTarget.id){
        case 'btnInicio':
            ruta = 'index.html';
            break;
        case 'btnInfo':
            ruta = 'info.html';
            break;
        case 'btnDescr':
            ruta = 'sube_ficheros.html';
            break;
        default:
            prompt('Error');
    };

    ipcRenderer.send('redirige', ruta);
}