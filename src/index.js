const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = socketio(server); // Socketio runs with raw http server


const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
    console.log('====================================');
    console.log('New WebSocket Connection');
    console.log('====================================');


    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Welcome!', user.username));
        socket.broadcast.to(user.room).emit('message', generateMessage(` ${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on('updateMessage', (message, callback) => {
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity detected');
        }

        const user = getUser(socket.id);

        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(` ${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {

        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${latitude},${longitude}`, user.username))
        callback()
    })
})

app.get('/', (req, res) => {
    return res.render('index');
})

server.listen(port, () => {
    console.log('====================================');
    console.log("Server up and running on port " + port);
    console.log('====================================');
})