import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import { cursusRouter } from './routes/cursus';
import { coursRouter } from './routes/cours';
import { competencesRouter } from './routes/competences';
import { formateursRouter } from './routes/formateurs';
import { sallesRouter } from './routes/salles';
import { promotionsRouter } from './routes/promotions';
import { planificationsRouter } from './routes/planifications';
import { ordonancementRouter } from './routes/ordonnancement';
import { contraIntesRouter } from './routes/contraintes';
import { dashboardRouter } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';
import logger from './services/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cursus', cursusRouter);
app.use('/api/cours', coursRouter);
app.use('/api/competences', competencesRouter);
app.use('/api/formateurs', formateursRouter);
app.use('/api/salles', sallesRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/planifications', planificationsRouter);
app.use('/api/ordonnancement', ordonancementRouter);
app.use('/api/contraintes', contraIntesRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

export default app;
