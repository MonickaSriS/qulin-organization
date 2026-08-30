import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import productionRoutes from './routes/production.routes.js';
import consumptionRoutes from './routes/consumption.routes.js';
import wasteRoutes from './routes/waste.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'qulin-backend' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/consumption', consumptionRoutes);
app.use('/api/v1/waste', wasteRoutes);
app.use('/api/v1/ai', aiRoutes);

// Future route mounts (Phase 9):
// app.use('/api/v1/outcomes', outcomeRoutes);

app.use(errorHandler);

export default app;
