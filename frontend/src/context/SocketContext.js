import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  useEffect(() => {
    if (user) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('register', user._id);
      });

      // Replay any registered listeners
      Object.entries(listenersRef.current).forEach(([event, cbs]) => {
        cbs.forEach(cb => socketRef.current.on(event, cb));
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user]);

  const on = (event, callback) => {
    if (!listenersRef.current[event]) listenersRef.current[event] = [];
    listenersRef.current[event].push(callback);
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) socketRef.current.off(event, callback);
    if (listenersRef.current[event]) {
      listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
    }
  };

  const emit = (event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  };

  return (
    <SocketContext.Provider value={{ on, off, emit, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
