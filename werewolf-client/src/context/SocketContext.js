import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Fault Tolerance: Auto-reconnect enabled
const SOCKET_URL = 'http://localhost:3000'; 
const socket = io(SOCKET_URL, {
  autoConnect: false, // We connect explicitly when needed
});

const SocketContext = createContext(socket);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Client Socket] Connected:', socket.id);
      // Logic from Edge Case Matrix: Emit REJOIN_ROOM to Sync State
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Client Socket] Disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
