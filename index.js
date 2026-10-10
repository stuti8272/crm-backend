import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './src/index.js';
import connectDB from './src/config/db.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
dotenv.config({ path: path.join(currentDirectory, 'src/.env') });

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();