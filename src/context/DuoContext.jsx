import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const DuoContext = createContext();

// Use window.location.hostname to connect to the same host (handles localhost vs network IP)
const SOCKET_URL = `http://${window.location.hostname}:3001`;

export const DuoProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [roomId, setRoomId] = useState(null);
    const [partner, setPartner] = useState(null); // { id: '...' }
    const [partnerWorkout, setPartnerWorkout] = useState(null); // { exercise: '...', sets: [...], ... }

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            autoConnect: false
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });

        newSocket.on('partner_joined', (data) => {
            console.log('Partner joined:', data);
            setPartner(data);
        });

        newSocket.on('workout_update', (data) => {
            console.log('Workout update received:', data);
            setPartnerWorkout(data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const connectToRoom = useCallback((room) => {
        if (socket && room) {
            socket.connect();
            socket.emit('join_room', room);
            setRoomId(room);
        }
    }, [socket]);

    const disconnectFromRoom = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setRoomId(null);
            setPartner(null);
            setPartnerWorkout(null);
        }
    }, [socket]);

    const broadcastUpdate = useCallback((data) => {
        if (socket && isConnected && roomId) {
            socket.emit('workout_update', { roomId, ...data });
        }
    }, [socket, isConnected, roomId]);

    return (
        <DuoContext.Provider value={{
            socket,
            isConnected,
            roomId,
            partner,
            partnerWorkout,
            connectToRoom,
            disconnectFromRoom,
            broadcastUpdate
        }}>
            {children}
        </DuoContext.Provider>
    );
};

export const useDuo = () => useContext(DuoContext);
