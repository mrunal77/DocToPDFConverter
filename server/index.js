const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Ensure upload and out directories exist
['uploads', 'out'].forEach(d => {
  const p = path.join(__dirname, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'ToPDFConverter server running' });
});

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const inputPath = req.file.path;
    const originalName = req.file.originalname;
    const outDir = path.join(__dirname, 'out');

    // LibreOffice command
    // Example: libreoffice --headless --convert-to pdf --outdir /path/to/out /path/to/file
    const safeInput = inputPath;

    const cmd = `libreoffice --headless --convert-to pdf --outdir "${outDir}" "${safeInput}"`;

    exec(cmd, (err, stdout, stderr) => {
      // cleanup uploaded file after conversion attempt
      try { fs.unlinkSync(inputPath); } catch (e) { }

      if (err) {
        console.error('Conversion error', err, stderr);
        return res.status(500).json({ error: 'Conversion failed. Ensure LibreOffice is installed on the server.' });
      }

      // LibreOffice converts and places file in out with same base name but .pdf
      const baseName = path.parse(originalName).name;
      const pdfPath = path.join(outDir, `${baseName}.pdf`);

      if (!fs.existsSync(pdfPath)) {
        // Try to find any pdf file in out dir modified recently
        const files = fs.readdirSync(outDir).filter(f => f.endsWith('.pdf'));
        if (files.length === 0) return res.status(500).json({ error: 'PDF not found after conversion' });
        // pick the most recent
        files.sort((a,b) => fs.statSync(path.join(outDir,b)).mtimeMs - fs.statSync(path.join(outDir,a)).mtimeMs);
        pdfPath = path.join(outDir, files[0]);
      }

      res.download(pdfPath, `${baseName}.pdf`, (downloadErr) => {
        if (downloadErr) console.error('Error sending file', downloadErr);
        // optionally delete the generated pdf after sending
        try { fs.unlinkSync(pdfPath); } catch (e) { }
      });
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`ToPDFConverter server listening on port ${PORT}`);
});
