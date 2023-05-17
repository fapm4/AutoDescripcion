const { ipcRenderer } = require('electron');
const { queryAncestorSelector } = require('../js/renderer.js');
let threshold_value;

function checkThreshold() {
    let radios = document.querySelectorAll('input[name=threshold]');
    let thresh_value;

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            thresh_value = radio.value;
            if (thresh_value == 2) {
                // Tengo que añadir el input para establecer el threshold
                let input = document.createElement('input');
                input.type = 'text';
                input.id = 'threshold_value';
                input.placeholder = '';
                input.style = 'margin-left: 10px; margin-right: 10px;';

                let li = queryAncestorSelector(radio, 'li');
                li.appendChild(input);
            } else {
                let input = document.querySelector('#threshold_value');
                if (input != undefined) {
                    input.style.display = 'none';
                }
            }
        });
    });
}

let dic = {
    'es-ES': 'Español',
    'en-US': 'Inglés',
};

const say = require('say');

let elegidoIdioma;
// let voices;

function getVoices() {
    return new Promise((resolve) => {
        say.getInstalledVoices((err, voices) => {
            return resolve(voices);
        });
    });
}

async function checkIdioma() {
    getVoices().then(voicesSay => {
        let liVoces = document.querySelector('#liVoces');
        let span = liVoces.querySelector('span');
        span.innerHTML = "";

        let select = document.createElement('select');
        select.style = 'margin-left: 10px; margin-right: 10px;';
        select.id = 'selectVoz';

        voicesSay.forEach(voice => {
            let option = document.createElement('option');
            option.value = voice;
            option.innerHTML = voice;
            select.appendChild(option);
        });

        span.appendChild(select);

        elegidoIdioma = select.value;

        select.addEventListener('change', (event) => {
            elegidoIdioma = event.target.value;
        });

        let input = document.createElement('input');
        input.type = 'text';
        input.id = 'inputPrueba';

        input.placeholder = 'Texto a reproducir';
        input.style = 'margin-left: 10px; margin-right: 10px;';
        span.appendChild(input);

        let button = document.createElement('button');
        button.id = 'buttonPrueba';
        button.innerHTML = "⏵︎";
        button.className = 'botonS';
        button.style = 'margin-left: 10px; margin-right: 10px;';
        span.appendChild(button);

        button.addEventListener('click', () => {
            say.speak(input.value, elegidoIdioma);
        });
    });
}

async function guardaConfig() {
    // Comprobar que si es manual se haya introducido un valor
    let radio = document.querySelector('input[name=threshold]:checked');
    if (radio.value == 2) {
        let input = document.querySelector('#threshold_value');
        if (input.value == '') {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'No has introducido un valor para el threshold',
            });
            return;
        }
        else {
            threshold_value = input.value;
        }
    }
    else {
        threshold_value = null;
    }

    let obj = {
        threshold_value,
        voz: elegidoIdioma
    };

    ipcRenderer.send('empezar_procesamiento', obj);
}

// 2.1 Cuando se pulse el botón de configuración, se abre la pantalla de configuración
ipcRenderer.once('pantalla_configuracion_cargada', async (event, arg) => {
    // 2.1.1 Controlar el threshold
    checkThreshold();

    // 2.1.2 Controlar el idioma - Si es 1, entonces hay que sintetizar
    if (arg == 1) {
        await checkIdioma();
    }
    else{
        let divVoces = document.querySelector('.voces');
        divVoces.style.display = 'none';
    }
    let btnGuardar = document.querySelector('.btnGuardar');
    if (
        btnGuardar != undefined) {
        btnGuardar.removeEventListener('click', guardaConfig, true);
        btnGuardar.addEventListener('click', guardaConfig, true);
    }
});