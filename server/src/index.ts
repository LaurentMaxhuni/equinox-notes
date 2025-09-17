import 'dotenv/config';
import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './auth.js';

const PORT = Number(process.env.PORT ?? 5174);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.disable('x-powered-by');

const corsOptions: CorsOptions = {
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Equinox Notes server listening on http://localhost:${PORT}`);
});
