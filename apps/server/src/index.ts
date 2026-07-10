import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { ParserEngine } from '@aster/parser';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// In-memory Multer for Upload Engine
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    uptime: process.uptime()
  });
});

const parserEngine = new ParserEngine();

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  // Stream the buffer through our ParserEngine
  const stream = Readable.from(req.file.buffer);
  
  const parseResult = await parserEngine.execute({ stream });

  if (!parseResult.success) {
    return res.status(500).json({ success: false, error: 'Parsing failed' });
  }

  res.json({
    success: true,
    data: {
      datasetId: 'ds_' + Date.now(),
      filename: req.file.originalname,
      size: req.file.size,
      metadata: {
        rowCount: parseResult.output.rowCount,
        delimiter: parseResult.output.delimiter,
        headers: parseResult.output.headers
      },
      // In a real app we wouldn't send all rows back if it's huge, but for preview we slice it.
      previewRows: parseResult.output.records.slice(0, 100) 
    }
  });
});

app.listen(port, () => {
  console.log(`Aster server listening on port ${port}`);
});
