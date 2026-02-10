const { Server } = require('socket.io');

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins for now, restrict in prod
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_room', (roomId, callback) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
            socket.to(roomId).emit('partner_joined', { id: socket.id });
            if (callback) callback();
        });

        socket.on('workout_update', (data) => {
            // data should contain: roomId, exerciseName, sets, reps, weight, etc.
            const { roomId, ...workoutData } = data;
            socket.to(roomId).emit('workout_update', workoutData);
        });

        socket.on('nudge_partner', (data) => {
            const { roomId, emoji } = data;
            socket.to(roomId).emit('nudge_received', { emoji, from: socket.id });
        });

        socket.on('partner_sync', (data) => {
            console.log('Server received partner_sync:', data);
            const { roomId, ...syncData } = data;
            if (roomId) {
                socket.to(roomId).emit('partner_sync', syncData);
                console.log(`Relayed partner_sync to room ${roomId}`);
            } else {
                console.warn('partner_sync received without roomId');
            }
        });

        socket.on('request_sync', (data) => {
            console.log('Server received request_sync:', data);
            const { roomId } = data;
            if (roomId) {
                socket.to(roomId).emit('request_sync', { id: socket.id });
                console.log(`Relayed request_sync to room ${roomId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
}

module.exports = setupSocket;
