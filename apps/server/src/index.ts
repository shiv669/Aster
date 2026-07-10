import express from 'express';
import multer from 'multer';

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

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  // TODO: Send to Dataset Intelligence Engine
  res.json({
    success: true,
    data: {
      datasetId: 'ds_' + Date.now(),
      filename: req.file.originalname,
      size: req.file.size
    }
  });
});

app.listen(port, () => {
  console.log(`Aster server listening on port ${port}`);
});
