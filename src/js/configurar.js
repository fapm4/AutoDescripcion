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

function reproducePrueba(input) {
    const utterance = new SpeechSynthesisUtterance();
    let voice = voices.filter(voice => voice.name == elegidoIdioma)[0];
    utterance.text = input.value;
    utterance.lang = voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
}

let elegidoIdioma;
let voices;
async function checkIdioma() {
    // Variables para saber que opción de idioma y género se ha elegido
    speechSynthesis.addEventListener('voiceschanged', async () => {
        voices = await speechSynthesis.getVoices();

        let idiomas = new Set(voices.map(voice => voice.lang));

        // Aux para ver lo elegido
        let divListado = document.createElement('div');
        divListado.id = 'divListado';

        // Idioma
        // Saco el div de idioma
        let idioma = document.querySelector('#idioma');

        let selectIdioma = document.createElement('select');
        selectIdioma.id = 'selectIdioma';

        // Creo las opciones para el idioma
        idiomas.forEach(idioma => {
            let option = document.createElement('option');
            option.value = idioma;
            option.innerHTML = dic[idioma];
            selectIdioma.appendChild(option);
        });

        if (idioma != undefined) {
            if (idioma.querySelector('#selectIdioma') == undefined) {
                idioma.appendChild(selectIdioma);
            }
        }

        // Asigno el por defecto
        elegidoIdioma = selectIdioma[selectIdioma.selectedIndex].value;
        // Cuando cambie el valor, actualizo el div
        selectIdioma.addEventListener('change', (event) => {
            elegidoIdioma = event.target.value;
        });

        // Tengo que añadir una nueva select para elegir la voz filtrada por género e idioma
        let ul = queryAncestorSelector(idioma, 'ul');
        let li = ul.querySelector('#liVoces');

        let voces_filtrada = voices.filter(voice => voice.lang == elegidoIdioma);

        let selectVoz = document.createElement('select');
        selectVoz.id = 'selectVoz';

        // Creo las opciones para la voz
        voces_filtrada.forEach(voice => {
            let option = document.createElement('option');
            option.value = voice.name;
            option.innerHTML = voice.name;
            selectVoz.appendChild(option);
        });

        if (li.querySelector('#selectVoz') == undefined) {
            li.appendChild(selectVoz);
        }

        elegidoIdioma = selectVoz[selectVoz.selectedIndex].value;

        selectVoz.addEventListener('change', (event) => {
            elegidoIdioma = event.target.value;
        });

        let divVoces = document.querySelector('.voces');

        let divPrueba = document.createElement('div');
        divPrueba.id = 'divPrueba';

        let inputPrueba = document.createElement('input');
        inputPrueba.type = 'text';
        inputPrueba.id = 'inputPrueba';
        inputPrueba.className = "inputPrueba";
        inputPrueba.placeholder = 'Prueba la voz';

        let btnPlay = document.createElement('button');
        let spanPlay = document.createElement('span');
        spanPlay.className = "material-icons";
        spanPlay.innerHTML = "⏵︎";
        btnPlay.appendChild(spanPlay);
        btnPlay.className = "btnPrueba botonR";
        btnPlay.id = "btnPlayPrueba";

        btnPlay.addEventListener('click', () => reproducePrueba(inputPrueba), true);

        divVoces.appendChild(divListado);
        divPrueba.appendChild(inputPrueba);
        divPrueba.appendChild(btnPlay);

        if (divVoces.querySelector('#divPrueba') == undefined) {
            divVoces.appendChild(divPrueba);
        }
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
        elegidoIdioma
    };

    ipcRenderer.send('empezar_procesamiento', obj);
}
let modo_grabacion;
// 2.1 Cuando se pulse el botón de configuración, se abre la pantalla de configuración
ipcRenderer.on('pantalla_configuracion_cargada', async (event, arg) => {
    modo_grabacion = arg;
    // 2.1.1 Controlar el threshold
    checkThreshold();

    // 2.1.2 Controlar el idioma
    if (arg == 1) {
        await checkIdioma();
    }
    else {
        let divVoces = document.querySelector('.voces');
        if (divVoces != undefined) {
            divVoces.style.display = 'none';
            elegidoIdioma = 'Microsoft David Desktop - English (United States)';
        }
    }

    let btnGuardar = document.querySelector('.btnGuardar');
    if (btnGuardar != undefined) {
        btnGuardar.addEventListener('click', () => guardaConfig(), true);
    }
});