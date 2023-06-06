const { ipcRenderer } = require('electron');
const { redirige } = require('../js/base_functions.js');
/////////////////////////// Este código afecta a -> index.html ///////////////////////////
// 1. Añado evento a los botones de la página index.html
ipcRenderer.on('carga_finalizada', (event, args) => {
    // Saco los botones de Inicio, Informaciónn y Describir
    const botones = document.querySelectorAll('.boton');
    
    botones.forEach(boton => {
        boton.removeEventListener('click', redirige, false);
        boton.addEventListener('click', redirige, false);
    });

    let guia = document.querySelector('#guia');
    guia.addEventListener('click', redirige, false);
});
