# AutoDescripción

Aplicación desarrollada para el Trabajo de Fin de Grado *Herramienta de ayuda para la creación de audiodescripción para vídeos* del Grado en Ingeniería Informática de la Universidad de Alicante.

## Características

- La aplicación permite subir cualquier fichero de vídeo para poder crear audiodescripciones de forma sencilla y rápida.
- La aplicación detecta automáticamente los silencios para poder insertar las descripciones.
- Se puede elegir entre dos modos de funcionamiento:
  - *Síntesis*: El usuario podrá, mediante texto, crear las descripciones.
  - *Grabación*: El usuario se podrá grabar directamente desde el micrófono del dispositivo las descripciones.
- Se pueden tanto añadir, como eliminar los instantes de tiempo donde se quiere insertar la descripción.
- Finalmente, se podrá descargar el vídeo con las audiodescripciones y un fichero con formato *WebVTT* (Web Video Text Track Format).

## Instalación

1. Clonar el proyecto.
2. Ejecutar `npm i` para actualizar las dependencias.
3. Instalar Python junto con la librería *Whisper* (`pip install -U openai-whisper`).

## Uso

Para comodidad a la hora de ejecutarlo, en la raíz del proyecto se encuentra un fichero `.ps1` para borrar los contenidos dentro de la carpeta *contenido* (donde se almacenan temporalmente los archivos).

Para usarlo en PowerShell, hay que ejecutar el siguiente comando: `New-Alias -Name ns -Value ruta/script.ps1`, donde *ruta* representa la ruta absoluta al archivo `.ps1`. Tras esto, al ejecutar `ns` en la consola se lanzará la aplicación.

## Configuración

A la hora de detectar los silencios, se puede utilizar un umbral "automático" resultado de analizar el ruido medio del archivo de video subido, o se puede establecer un valor concreto en decibelios.

En cuanto a la síntesis, se podrán utilizar aquellas voces que estén instaladas en el sistema operativo.

Si una vez detectados los silencios, se quiere modificar para añadir o eliminar nuevos instantes, bastará con hacer clic en la "x" para borrar, y el asistente para añadir otros nuevos.
