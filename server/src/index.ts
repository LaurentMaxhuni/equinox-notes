import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createAuthRouter } from './auth.js';

dotenv.config();

const PORT = Number(process.env.PORT ?? 5174);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();


app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', createAuthRouter());

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Equinox Notes server listening on http://localhost:${PORT}`);
});
