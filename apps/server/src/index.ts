import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { ParserEngine } from '@aster/parser';
import { BatchOrchestrator } from '@aster/ai';

// YAGNI: Zero-dependency native .env loader
try {
  const env = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  env.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim().replace(/["']/g, '');
  });
} catch (e) {}

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

  // Parse the buffer natively (ParserEngine handles encoding recovery)
  const parseResult = await parserEngine.execute({ buffer: req.file.buffer });

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

const aiOrchestrator = new BatchOrchestrator(process.env.GROQ_API_KEY || '');

// Process endpoint (runs the full AI transformation)
app.post('/api/process', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const parseResult = await parserEngine.execute({ buffer: req.file.buffer });
  if (!parseResult.success) {
    return res.status(500).json({ success: false, error: 'Parsing failed' });
  }

  // YAGNI: Slice to 30 rows for real-time demo speed and rate-limit avoidance
  const rowsToProcess = parseResult.output.records.slice(0, 30);
  console.log(`API Process: Parsed ${parseResult.output.records.length} rows. Sending ${rowsToProcess.length} rows to AI.`);
  
  try {
    const crmRecords = await aiOrchestrator.processDataset(rowsToProcess, 10);
    res.json({ success: true, data: crmRecords });
  } catch (error: any) {
    console.error("AI Processing Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Aster server listening on port ${port}`);
});
