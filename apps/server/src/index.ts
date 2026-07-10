import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { ParserEngine } from '@aster/parser';

const app = express();
const port = process.env.PORT || 4000;

// Native CORS (YAGNI on the cors dependency)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

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

  // Parse the buffer as a string natively
  const csvString = req.file.buffer.toString('utf8');
  const parseResult = await parserEngine.execute({ csvString });

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

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Aster server listening on port ${port}`);
});
