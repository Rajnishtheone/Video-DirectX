const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Video filter (brightness, contrast, etc.)
router.post('/filter', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `${Date.now()}-filtered.mp4`);
  const { brightness = 0, contrast = 1, saturation = 1, filterType = 'brightness' } = req.body;
  let filter = '';
  if (filterType === 'grayscale') filter = 'hue=s=0';
  if (filterType === 'brightness') filter = `eq=brightness=${brightness}`;
  if (filterType === 'contrast') filter = `eq=contrast=${contrast}`;
  if (filterType === 'saturation') filter = `eq=saturation=${saturation}`;
  if (filterType === 'custom') filter = `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`;

  ffmpeg(inputPath)
    .videoFilters(filter)
    .outputOptions('-movflags', 'faststart')
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      res.status(500).json({ error: err.message });
      fs.unlinkSync(inputPath);
    })
    .run();
});

// Text overlay
router.post('/overlay/text', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `${Date.now()}-overlay.mp4`);
  const { text = 'Sample Text', fontSize = 36, fontColor = 'white', x = '(w-text_w)/2', y = '(h-text_h)-20' } = req.body;
  const drawtext = `drawtext=text='${text}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${x}:y=${y}`;
  ffmpeg(inputPath)
    .videoFilters(drawtext)
    .outputOptions('-movflags', 'faststart')
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      res.status(500).json({ error: err.message });
    })
    .run();
});

// Image overlay (logo/watermark)
router.post('/overlay/image', upload.fields([{ name: 'video' }, { name: 'image' }]), (req, res) => {
  const inputPath = req.files['video'][0].path;
  const imagePath = req.files['image'][0].path;
  const outputPath = path.join('uploads', `${Date.now()}-img-overlay.mp4`);
  ffmpeg(inputPath)
    .input(imagePath)
    .complexFilter(['[0:v][1:v] overlay=10:10'])
    .outputOptions('-movflags', 'faststart')
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(imagePath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      res.status(500).json({ error: err.message });
      fs.unlinkSync(inputPath);
      fs.unlinkSync(imagePath);
    })
    .run();
});

// Mute video
router.post('/audio/mute', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `${Date.now()}-muted.mp4`);
  ffmpeg(inputPath)
    .noAudio()
    .outputOptions('-movflags', 'faststart')
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      res.status(500).json({ error: err.message });
      fs.unlinkSync(inputPath);
    })
    .run();
});

// Replace audio
router.post('/audio/replace', upload.fields([{ name: 'video' }, { name: 'audio' }]), (req, res) => {
  // console.log("Files: ", req.files);
  // console.log("Video file: ", req.files?.video?.[0]);
  // console.log("Audio file: ", req.files?.audio?.[0]);

  if (!req.files?.video || !req.files?.audio) {
    return res.status(400).json({ error: 'Both video and audio files are required' });
  }

  const inputPath = path.resolve(req.files['video'][0].path);
  const audioPath = path.resolve(req.files['audio'][0].path);
  const outputPath = path.resolve('uploads', `${Date.now()}-replaced-audio.mp4`);
  ffmpeg()
    .input(inputPath)
    .input(audioPath)
    .outputOptions(['-map 0:v:0', '-map 1:a:0', '-c:v copy', '-shortest', '-movflags faststart'])
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(audioPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('stderr', (stderrLine) => {
      console.error('FFmpeg stderr:', stderrLine);
    })
    .on('error', err => {
      res.status(500).json({ error: err.message });
      fs.unlinkSync(inputPath);
      fs.unlinkSync(audioPath);
    })
    .run();
});

// Merge videos with trim, order, fade, speed, export format/resolution
router.post('/merge', upload.array('videos', 10), (req, res) => {
  const filePaths = req.files.map(f => f.path);
  const exportFormat = req.body.exportFormat || 'mp4';
  const exportResolution = req.body.exportResolution || 'original';
  const outputPath = path.join('uploads', `${Date.now()}-merged.${exportFormat}`);
  const order = req.body.order ? JSON.parse(req.body.order) : filePaths.map((_, i) => i);
  // Collect trim and effect info
  const clips = order.map((idx, i) => {
    const start = req.body[`start_${idx}`] ? Number(req.body[`start_${idx}`]) : 0;
    const end = req.body[`end_${idx}`] ? Number(req.body[`end_${idx}`]) : null;
    const fadeIn = req.body[`fadeIn_${idx}`] === 'true';
    const fadeOut = req.body[`fadeOut_${idx}`] === 'true';
    const speed = req.body[`speed_${idx}`] ? Number(req.body[`speed_${idx}`]) : 1;
    return { path: filePaths[idx], start, end, fadeIn, fadeOut, speed };
  });
  // Prepare filter_complex for trimming, fade, speed
  let filterInputs = '';
  let filterChains = [];
  let inputArgs = [];
  clips.forEach((clip, i) => {
    inputArgs.push('-i', clip.path);
    let chain = `[${i}:v]`;
    let filters = [];
    if (clip.start !== 0 || clip.end !== null) {
      let trim = `trim=start=${clip.start}`;
      if (clip.end !== null) trim += `:end=${clip.end}`;
      filters.push(trim);
      filters.push('setpts=PTS-STARTPTS');
    }
    if (clip.speed && clip.speed !== 1) {
      filters.push(`setpts=${(1/clip.speed).toFixed(3)}*PTS`);
    }
    if (clip.fadeIn) {
      filters.push('fade=t=in:st=0:d=1');
    }
    if (clip.fadeOut && clip.end !== null) {
      filters.push(`fade=t=out:st=${Math.max(0, clip.end - clip.start - 1)}:d=1`);
    }
    filters.push('format=yuv420p');
    chain += filters.length ? filters.join(',') : '';
    chain += `[v${i}]`;
    filterChains.push(chain);
    filterInputs += `[v${i}]`;
  });
  filterInputs += `concat=n=${clips.length}:v=1:a=0[outv]`;
  const filterComplex = [...filterChains, filterInputs].join(';');
  // Set resolution
  let resolutionMap = { '480p': 'scale=-2:480', '720p': 'scale=-2:720', '1080p': 'scale=-2:1080' };
  let outputOptions = ['-map', '[outv]', '-movflags', 'faststart'];
  if (exportResolution !== 'original' && resolutionMap[exportResolution]) {
    outputOptions.push('-vf', resolutionMap[exportResolution]);
  }
  // Set format
  let formatOptions = { mp4: ['-c:v', 'libx264'], webm: ['-c:v', 'libvpx'], mov: ['-c:v', 'prores_ks'] };
  if (formatOptions[exportFormat]) {
    outputOptions.push(...formatOptions[exportFormat]);
  }
  let ffmpegCmd = ffmpeg();
  inputArgs.forEach(arg => ffmpegCmd = ffmpegCmd.addInput(arg));
  ffmpegCmd
    .complexFilter(filterComplex, ['outv'])
    .outputOptions(...outputOptions)
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        filePaths.forEach(p => fs.unlinkSync(p));
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      res.status(500).json({ error: err.message });
      filePaths.forEach(p => fs.unlinkSync(p));
    })
    .run();
});

module.exports = router; 