const { ipcRenderer } = require('electron');
const { eventosNav } = require('../js/base_functions.js');

function pedir_fichero() {
    ipcRenderer.send('pedir_fichero');
}

ipcRenderer.on('subir_ficheros', (event, arg) => {
    eventosNav();
    // 2.2 Cuando se pulse el botón de subir fichero, se abre el diálogo para seleccionar el fichero
    console.log('Main 2 - Renderer 1 -> Añado evento para subir fichero');
    const botonS = document.querySelector('.botonS');
    if (botonS != undefined) {
        botonS.removeEventListener('click', pedir_fichero);
        botonS.addEventListener('click', pedir_fichero);
    }
});

// 2. Una vez se cargue la página de subir ficheros, añado el evento de subir fichero
let modo;

function cargar_pantalla_configuracion(modo) {
    ipcRenderer.send('cargar_pantalla_configuracion', modo);
}

// 4.3 Si no se ha seleccionado ningún fichero, envío un mensaje de error
ipcRenderer.on('no_fichero_seleccionado', (event, arg) => {
    Swal.fire({
        icon: 'info',
        title: 'Oops...',
        text: 'Recuerda que debes seleccionar un fichero',
    });
});

// Si no, actualiza el nombre del label con el nombre del fichero
ipcRenderer.on('actualiza_etiqueta', (event, arg) => {
    let label = document.querySelector('#fileName');
    label.innerHTML = arg.nombre_fichero;

    const btnConf = document.querySelector('#btnConf');
    let radios = document.querySelectorAll('input[name=modo]');
    if (radios != undefined) {
        modo = document.querySelector('input[name=modo]:checked').value;

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                modo = radio.value;
            });
        });
    }

    btnConf.addEventListener('click', cargar_pantalla_configuracion, true);
    btnConf.addEventListener('click', () => { cargar_pantalla_configuracion(modo) }, true);
});