const { ipcRenderer } = require('electron');

function eventosNav() {
    let nav = document.querySelector('.nav');
    let botones = nav.querySelectorAll('.boton');

    botones.forEach(boton => {
        boton.removeEventListener('click', redirige, false);
        boton.addEventListener('click', redirige, false);
    });
}

function redirige(event) {
    const currentTarget = event.currentTarget;

    switch (currentTarget.id) {
        case 'btnInicio':
            ipcRenderer.send('redirige_pagina', 'index.html');
            break;

        case 'btnInfo':
            ipcRenderer.send('redirige_pagina', 'index.html');
            break;

        case 'btnDescr':
            ipcRenderer.send('redirige_pagina', 'sube_ficheros.html');
            break;

        default:
            prompt('Error');
    };
}

function queryAncestorSelector(node, selector) {
    var parent = node.parentNode;

    while (parent !== document) {
        if (parent.matches(selector)) {
            return parent;
        }
        parent = parent.parentNode;
    }

    return null;
}

function convierteTiempo(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

function getIndex(output) {
    let filename = output.split('\\').pop();
    const regex = /desc(\d+)\./;
    const match = filename.match(regex);
    const indice = match[1];
    return indice;
}

function tiempoEnMilisegundos(tiempo) {
    let partes = tiempo.split(':');
    let horas = parseInt(partes[0]);
    let minutos = parseInt(partes[1]);
    let segundos = parseInt(partes[2]);

    return (horas * 3600 + minutos * 60 + segundos) * 1000;
}

function tiempoEnSegundos(tiempo) {
    var partes = tiempo.split(":");
    var horas = parseInt(partes[0]);
    var minutos = parseInt(partes[1]);
    var segundos = parseInt(partes[2]);

    return horas * 3600 + minutos * 60 + segundos;
}

module.exports = { redirige, queryAncestorSelector,  convierteTiempo, getIndex, tiempoEnMilisegundos, tiempoEnSegundos, eventosNav};
