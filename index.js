const express = require('express');
const http = require('http');
const socketio = require('socket.io');
var cors = require('cors');
const PORT = process.env.PORT || 5000;

const app = express();

const router = require('./router')
const server = http.createServer(app);
const {addUser,removeUser,getUser,getUsersInRoom} = require('./users');
const io = socketio(server, {
  cors: {
    origin: '*',
  }});
app.use(cors());
io.on('connection',(socket)=>{
  console.log('we have a new connection');

  socket.on('join',({name,room},callback)=>{
    const user = addUser({id:socket.id,name:name,room:room}).user;

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    callback();
  });
  socket.on('sendMessage',(message,callback)=>{
    const user = getUser(socket.id);
    io.to(user.room).emit('message',{user:user.name,text:message});
    callback();
  });
  socket.on('disconnect',()=>{
    console.log('user had left');
  })
});
app.use(router);
server.listen(PORT,()=>{console.log(`Server has started on port ${PORT}`)})