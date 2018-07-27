var express = require('express');
var app = express();
// var http = require('http').createServer(app)
var server = require('http').Server(app)
var io = require("socket.io")(server)

// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});
app.use(express.static(__dirname))
// app.set('views',__dirname+'/public/views/')

app.get('/123', function (req, res) {
    res.send("socket open da~")
})


app.post('/getPrivateRoom', async function (req, res) {
    for (var flag = true, i = 1; i <= 1000; i++) {
        if (typeof io.nsps[`/PrivateRoom${i}`] == 'undefined') {
            await prmiseSetTimeout(async function () {
                flag = await creatNamespace(io, `PrivateRoom${i}`)

            })
            if (flag == false) {
                console.log(`flag is false it mean /PrivateRoom${i} is be created`)
                flag = true
            } else {
                console.log(`flag is true it is mean you create /PrivateRoom${i}`)
                res.send(`PrivateRoom${i}`)
                break
            }

        }
        if (Object.keys(io.nsps[`/PrivateRoom${i}`].connected).length == 1) {
            await prmiseSetTimeout(() => {
                if (Object.keys(io.nsps[`/PrivateRoom${i}`].connected).length == 1) {
                    res.send(`PrivateRoom${i}`)
                } else {
                    flag = false
                }
            });
            if (flag == false) {
                falg = true
                continue
            } else {
                break
            }


        }
    }
}
)

function prmiseSetTimeout(callback) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            callback()
            resolve()
        }, 3000)
    })


}


var publicNsp = io.of('/namespace')
publicNsp.on('connection', function (socket) {
    socket.on('commingRoom', function (data) {
        socket.broadcast.emit('sendMsg', { user: 'server', text: `${data.user} comming!` })
    })
    socket.emit('sendMsg', { user: 'server', text: 'welcome public chat room' });
    socket.on('sendMsgFromClient', function (data) {
        console.log(data)
        publicNsp.emit("sendMsg", data)
    })
    socket.on('disconnect', function () {
        console.log('some one leave')
    })
})




function creatNamespace(io, nsp) {
    return new Promise(function (resolve, rejext) {
        if (typeof io.nsps[`/${nsp}`] !== 'undefined') {
            console.log('nsp is already ')
            resolve(false)
        } else {

            console.log(`/${nsp} creating!`)
            const privateNsp = io.of(`/${nsp}`)
            
            privateNsp.on('connection', function (socket) {
                socket.on('commingRoom', function (data) {
                    socket.broadcast.emit('sendMsg', { user: 'server', text: `${data.user} comming!` })
                })
                if (Object.keys(privateNsp.connected).length == 1) {
                    socket.emit('sendMsg', { user: 'server', text: 'welcome to private room!' })
                    socket.emit('sendMsg', { user: 'server', text: 'please wait another one!' })
                } else {
                    socket.emit('sendMsg', { user: 'server', text: 'welcome to private room!' })
                    socket.emit('sendMsg', { user: 'server', text: 'have fun!' })
                }

                socket.on('sendMsgFromClient', function (data) {
                    if (Object.keys(privateNsp.connected).length > 1) {
                        console.log(data)
                        privateNsp.emit("sendMsg", data)
                    } else {

                        privateNsp.emit("sendMsg", { user: 'server', text: 'no body talk with you ....' })
                    }

                })
                socket.on('disconnect', function () {
                    privateNsp.emit('sendMsg', { user: 'server', text: 'another leave!' })
                    const connectedNameSpaceSockets = Object.keys(privateNsp.connected); // Get Object with Connected SocketIds as properties
                    connectedNameSpaceSockets.forEach(socketId => {
                        privateNsp.connected[socketId].disconnect(); // Disconnect Each socket
                    });
                    privateNsp.removeAllListeners(); // Remove all Listeners for the event emitter
                    delete io.nsps[`/${nsp}`];
                })
                // console.log(privateNsp.sockets)

            })
            
            resolve(true)
        }
    })


}

server.listen(8000, function () {
    console.log("socket open port 8000 ...")
})
