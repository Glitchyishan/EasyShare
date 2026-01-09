import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import { setupSockets } from './sockets';

dotenv.config();

const app = express();
const server = http.createServer(app);
// Allow multiple origins: env FRONTEND_URLS (comma separated), FRONTEND_URL, plus sensible defaults
const envOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([
    ...envOrigins,
    'https://easy-share-green.vercel.app',
    'http://localhost:3000',
]));

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow non-browser clients
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
};

const io = new Server(server, {
    cors: {
        ...corsOptions,
        origin: corsOptions.origin,
    }
});

app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.set('io', io); // Share io instance

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

// Socket.IO
setupSockets(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
