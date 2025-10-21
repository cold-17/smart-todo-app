const jwt = require('jsonwebtoken');

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> { socketId, username, currentRoom }
const roomUsers = new Map(); // roomId -> Set of userIds

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username || 'Anonymous';
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Store active user
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      username: socket.username,
      currentRoom: null
    });

    // Join user's personal room (for their todos)
    const personalRoom = `user:${socket.userId}`;
    socket.join(personalRoom);

    // Handle joining a shared list room
    socket.on('join-list', (listId) => {
      const previousRoom = activeUsers.get(socket.userId)?.currentRoom;

      // Leave previous room if any
      if (previousRoom && previousRoom !== personalRoom) {
        socket.leave(previousRoom);
        const prevRoomUsers = roomUsers.get(previousRoom) || new Set();
        prevRoomUsers.delete(socket.userId);

        // Notify others in previous room
        socket.to(previousRoom).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          activeUsers: Array.from(prevRoomUsers).map(uid => ({
            userId: uid,
            username: activeUsers.get(uid)?.username
          }))
        });
      }

      // Join new room
      const roomId = `list:${listId}`;
      socket.join(roomId);

      // Update active users
      activeUsers.set(socket.userId, {
        ...activeUsers.get(socket.userId),
        currentRoom: roomId
      });

      // Update room users
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.userId);

      // Get all users in this room
      const usersInRoom = Array.from(roomUsers.get(roomId)).map(uid => ({
        userId: uid,
        username: activeUsers.get(uid)?.username
      }));

      // Notify user of current room members
      socket.emit('room-joined', {
        listId,
        activeUsers: usersInRoom
      });

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        username: socket.username,
        activeUsers: usersInRoom
      });

      console.log(`User ${socket.username} joined list ${listId}`);
    });

    // Handle leaving a shared list
    socket.on('leave-list', (listId) => {
      const roomId = `list:${listId}`;
      socket.leave(roomId);

      const roomUsersSet = roomUsers.get(roomId);
      if (roomUsersSet) {
        roomUsersSet.delete(socket.userId);

        const usersInRoom = Array.from(roomUsersSet).map(uid => ({
          userId: uid,
          username: activeUsers.get(uid)?.username
        }));

        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          activeUsers: usersInRoom
        });
      }

      activeUsers.set(socket.userId, {
        ...activeUsers.get(socket.userId),
        currentRoom: personalRoom
      });

      console.log(`User ${socket.username} left list ${listId}`);
    });

    // Handle todo created
    socket.on('todo:created', (data) => {
      const { todo, listId } = data;

      if (listId) {
        // Broadcast to all users in the shared list except sender
        socket.to(`list:${listId}`).emit('todo:created', {
          todo,
          createdBy: {
            userId: socket.userId,
            username: socket.username
          }
        });
      }
    });

    // Handle todo updated
    socket.on('todo:updated', (data) => {
      const { todo, listId } = data;

      if (listId) {
        socket.to(`list:${listId}`).emit('todo:updated', {
          todo,
          updatedBy: {
            userId: socket.userId,
            username: socket.username
          }
        });
      }
    });

    // Handle todo deleted
    socket.on('todo:deleted', (data) => {
      const { todoId, listId } = data;

      if (listId) {
        socket.to(`list:${listId}`).emit('todo:deleted', {
          todoId,
          deletedBy: {
            userId: socket.userId,
            username: socket.username
          }
        });
      }
    });

    // Handle todo completed/uncompleted
    socket.on('todo:toggled', (data) => {
      const { todoId, completed, listId } = data;

      if (listId) {
        socket.to(`list:${listId}`).emit('todo:toggled', {
          todoId,
          completed,
          toggledBy: {
            userId: socket.userId,
            username: socket.username
          }
        });
      }
    });

    // Handle user typing indicator
    socket.on('typing', (data) => {
      const { listId, isTyping } = data;

      if (listId) {
        socket.to(`list:${listId}`).emit('user-typing', {
          userId: socket.userId,
          username: socket.username,
          isTyping
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);

      const userData = activeUsers.get(socket.userId);
      if (userData?.currentRoom) {
        const roomUsersSet = roomUsers.get(userData.currentRoom);
        if (roomUsersSet) {
          roomUsersSet.delete(socket.userId);

          const usersInRoom = Array.from(roomUsersSet).map(uid => ({
            userId: uid,
            username: activeUsers.get(uid)?.username
          }));

          io.to(userData.currentRoom).emit('user-left', {
            userId: socket.userId,
            username: socket.username,
            activeUsers: usersInRoom
          });
        }
      }

      activeUsers.delete(socket.userId);
    });
  });
};
