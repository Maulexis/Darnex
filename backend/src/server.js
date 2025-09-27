const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const apiRoutes = require('./routes/api');
const { initializeSimulation, simulateMovement } = require('./services/trainSimulator');

const app = express();
const server = http.createServer(app);
const io = new Server(server,{cors:{origin:'*'}});

const PORT = process.env.PORT||3001;

app.use(express.json());
app.use('/api', apiRoutes);

const redisClient = createClient();
redisClient.on('error', err=>console.log('Redis Client Error',err));

async function main(){
    await redisClient.connect();
    console.log('Connected to Redis!');
    await initializeSimulation();

    setInterval(async ()=>{ await simulateMovement(io); },5000);

    io.on('connection', socket=>{
        console.log(`User connected: ${socket.id}`);
        socket.on('disconnect', ()=>console.log(`User disconnected: ${socket.id}`));
    });

    server.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));
}

main();
