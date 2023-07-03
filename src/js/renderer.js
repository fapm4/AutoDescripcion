const { ipcRenderer } = require('electron');
const { redirige } = require('../js/base_functions.js');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Carga finalizada');
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.removeEventListener('click', redirige, false);
        boton.addEventListener('click', redirige, false);
    });

    let guia = document.querySelector('#guia');
    if(guia){
        guia.removeEventListener('click', redirige, false);
        guia.addEventListener('click', redirige, false);
    }
});
