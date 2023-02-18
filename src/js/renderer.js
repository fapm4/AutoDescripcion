var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('cargaFinalizada', (event, arg) => {
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.addEventListener('click', redirige, true);
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

ipcRenderer.on('redireccionFinalizada', (event, arg) => {
    const boton = document.querySelector('.botonR');
    boton.addEventListener('click', subeFichero, true);

});

function subeFichero(){
    let input = document.querySelector('#file');
    let modo = document.querySelectorAll('input[name=modo]:checked');
    
    if(input.value == ""){
        alert('No has seleccionado ningún fichero');
    }
    else{
        switch(modo[0].value){
            case '1':
                    // Modo 1: Generar formulario con los espacioes
                break;
            case '2':
                    // Modo 2: Grabar audio
                break;
            case '3':
                    // Modo 3: IA
                break;
    }
}