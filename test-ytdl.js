const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
ytdl('https://www.youtube.com/watch?v=1V_46CX-I-4')
  .pipe(fs.createWriteStream('video.mp4'))
  .on('finish', () => console.log('Downloaded'));
