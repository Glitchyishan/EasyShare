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
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const allowedOrigin = process.env.FRONTEND_URL || "*";

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}));

// Explicitly handle preflight requests
app.options('*', cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}));
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
