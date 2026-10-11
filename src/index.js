import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1', routes);

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'CRM API is running' });
});

export default app;

