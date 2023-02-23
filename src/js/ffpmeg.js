const ffmpegPath = require('ffmpeg-static-electron').path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('node-ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);

ffprobe(route, function(err, metadata) {
    if (err) {
      console.error(err);
      return;
    }
  
    // Obtener información sobre el audio
    const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
    console.log(`Duración del audio: ${audioStream.duration}`);
    console.log(`Frecuencia de muestreo: ${audioStream.sample_rate}`);
});

module.exports = {
    ffprobe
}
  