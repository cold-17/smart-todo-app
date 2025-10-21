import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const { isAuthenticated } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
      setActiveUsers([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Handle room events
    newSocket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      setActiveUsers(data.activeUsers || []);
    });

    newSocket.on('user-joined', (data) => {
      console.log('User joined:', data.username);
      setActiveUsers(data.activeUsers || []);
    });

    newSocket.on('user-left', (data) => {
      console.log('User left:', data.username);
      setActiveUsers(data.activeUsers || []);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  // Join a shared list room
  const joinList = useCallback((listId) => {
    if (socket && connected) {
      socket.emit('join-list', listId);
      setCurrentListId(listId);
    }
  }, [socket, connected]);

  // Leave a shared list room
  const leaveList = useCallback((listId) => {
    if (socket && connected) {
      socket.emit('leave-list', listId);
      setCurrentListId(null);
      setActiveUsers([]);
    }
  }, [socket, connected]);

  // Emit todo created event
  const emitTodoCreated = useCallback((todo, listId = null) => {
    if (socket && connected && listId) {
      socket.emit('todo:created', { todo, listId });
    }
  }, [socket, connected]);

  // Emit todo updated event
  const emitTodoUpdated = useCallback((todo, listId = null) => {
    if (socket && connected && listId) {
      socket.emit('todo:updated', { todo, listId });
    }
  }, [socket, connected]);

  // Emit todo deleted event
  const emitTodoDeleted = useCallback((todoId, listId = null) => {
    if (socket && connected && listId) {
      socket.emit('todo:deleted', { todoId, listId });
    }
  }, [socket, connected]);

  // Emit todo toggled event
  const emitTodoToggled = useCallback((todoId, completed, listId = null) => {
    if (socket && connected && listId) {
      socket.emit('todo:toggled', { todoId, completed, listId });
    }
  }, [socket, connected]);

  // Listen for todo events from other users
  const onTodoCreated = useCallback((callback) => {
    if (socket) {
      socket.on('todo:created', callback);
      return () => socket.off('todo:created', callback);
    }
  }, [socket]);

  const onTodoUpdated = useCallback((callback) => {
    if (socket) {
      socket.on('todo:updated', callback);
      return () => socket.off('todo:updated', callback);
    }
  }, [socket]);

  const onTodoDeleted = useCallback((callback) => {
    if (socket) {
      socket.on('todo:deleted', callback);
      return () => socket.off('todo:deleted', callback);
    }
  }, [socket]);

  const onTodoToggled = useCallback((callback) => {
    if (socket) {
      socket.on('todo:toggled', callback);
      return () => socket.off('todo:toggled', callback);
    }
  }, [socket]);

  const value = {
    socket,
    connected,
    activeUsers,
    currentListId,
    joinList,
    leaveList,
    emitTodoCreated,
    emitTodoUpdated,
    emitTodoDeleted,
    emitTodoToggled,
    onTodoCreated,
    onTodoUpdated,
    onTodoDeleted,
    onTodoToggled
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
