const express = require('express')
const bodyParser = require('body-parser')
const axios = require("axios")
const app = express()
const port = process.env.PORT || 8080
const userModel = require("./src/models/user")
const organizationModel = require("./src/models/organization")
const eventModel = require("./src/models/event")
const db = require("./src/db/db")
const mongoose = require("mongoose");
const authCheck = require("./src/middleware/authCheck")
const { User } = require("./src/middleware/user")
const cors = require("cors")
const eventService = require("./src/services/eventService")

const http = require("http")
const { Server } = require("socket.io")

db.connect();

app.set('trust proxy', true);
app.use(bodyParser.json())
app.use(cors())

// DUMB TERRITORY
app.get('/', (req, res) => {
    res.status(200).json({"test": 'Hello World!'})
})

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// <- GIGA IMPORTANT ->
app.get('/_ah/start', (req, res) => {
    res.status(200).json({"hello": "world"});
})
// <- GIGA IMPORTANT -/>

app.use(express.static("./static"))
app.get("/test-chat", (req, res) => {
    res.sendFile("./static/index.html", {root: __dirname})
})

const isAuthenticated = async (req,res,next) => {
    // console.log("isAuth fired")
    // console.log(req.headers)
    const check = await authCheck(req.headers.accesstoken, req.headers.refreshtoken)
    // console.log("authCheck done")
    // console.log(check)
    if (typeof check === 'string' || check instanceof String) {
        // console.log("check is a string, setting new access token")
        // console.log(res.headers)
        res.set({"accessToken": check})
    } else if (typeof check === 'boolean' || check instanceof Boolean) {
        // console.log("check is boolean with value " + check)
        if (!check) {
            // console.log("check failed, 403")
            res.status(403).send({status: "Unauthenticated", code: 403})
        }
    }
    next();
}

let userData
app.post('/api/login', (req, res) => {
    let data = req.body
    data.fingerprint = process.env.NB_FINGERPRINT
        axios.post(process.env.NB_AUTH_SERVICE_URL + "/login", data)
            .then((response) => {
                userData = new User(response.data.userId)
                // console.log(response.headers)
                res.set(response.headers)

                res.json({"status": "success", "data": response.data})
            }).catch((err) => {
            console.error(err)
            res.json({"status": "error", "code": err.status})
        })
})

app.post('/api/user', (req, res) => {
    userModel.newUser(req.body).then(
        (response) => res.status(200).json(response)
    ).catch((err) => console.log("Err? " + err))
})

app.post('/api/check-token', (req, res) => {
     axios.post(process.env.NB_AUTH_SERVICE_URL + "/check-token", {
         "token": req.body.data.accessToken,
         "fingerprint": process.env.NB_FINGERPRINT,
         "target": "/"
     })
        .then((response) => {
            res.status(response.status).json(response.data);
        })
        .catch((err) => res.status(500).json({"error": err,"message":"error checking token"}))
})

app.post('/api/refresh-access-token', (req, res) => {
    axios.post(process.env.NB_AUTH_SERVICE_URL + "/refresh-access-token", {
        "fingerprint": process.env.NB_FINGERPRINT,
        "refreshToken": req.body.data.refreshToken
    })
        .then((response) => {
            res.status(200).json({"accessToken":response.data.accessToken})
        })
        .catch((err) => res.status(500).json({"error": err, "message": "error refreshing access token"}))
})

// Routes requiring auth and using isAuthenticated middleware
app.use(isAuthenticated)
app.get('/api/users', (req,res) => {
    userModel.getUsers().then(
        (result) => res.json(result)
    ).catch((err) => console.log("Err: " + err))
})

app.post('/api/organization', (req, res) => {
    organizationModel.newOrganization(req.body).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).json({"error": err}))
})

app.post('/api/event', (req, res) => {
    req.body.createdBy = userData.userId
    eventModel.newEvent(req.body).then(
        (result) => res.json(result)
    ).catch((err) => res.status(500).json({"error": err}))
})

app.route('/api/event/:id')
    .get((req, res) => {
        eventModel.getEvent(req.params.id).then(
            (result) => res.json(result)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .put((req, res) => {
        eventModel.updateEvent(req.params.id, req.body).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        eventModel.deleteEvent(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
app.post('/api/event/:id/invite', (req, res) => {
    eventService.inviteUsers(req.params.id, req.body.users).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).json({"error": err}))
})
app.get('/api/events', (req, res) => {
    eventModel.getEventsForUser(userData.userId).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).json({"error": err}))
})

app.route('/api/user/:id')
    .get((req, res) => {
    userModel.getUser(req.params.id).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).json({"error": err}))
})
    .put((req, res) => {
        userModel.updateUser(req.params.id, req.body).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        userModel.deleteUser(req.params.id).then(
            (data) => res.status(200).json({"message": "User deleted", "info": data})
        ).catch((err) => res.status(500).json({"error": err}))
    })


app.route('/api/organization/:id')
    .get((req, res) => {
        organizationModel.getOrganization(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .put((req, res) => {
        // TODO: returns old model data instead of updated (but STILL UPDATES)
        organizationModel.updateOrganization(req.params.id, req.body).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        organizationModel.deleteOrganization(req.params.id).then(
            (data) => res.status(200).json({"message": "Organization deleted", "info": data})
        ).catch((err) => res.status(500).json({"error": err}))
    })

app.route('/api/event/:id   ')
    .get((req, res) => {
        eventModel.getEvent(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .put((req, res) => {
        // TODO: returns old model data instead of updated (but STILL UPDATES)
        eventModel.updateEvent(req.params.id, req.body).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        eventModel.deleteEvent(req.params.id).then(
            (data) => res.status(200).json({"message": "Organization deleted", "info": data})
        ).catch((err) => res.status(500).json({"error": err}))
    })

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB")
})

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    path: '/socket.io/'
})

const users = []
io.on('connection', (socket) => {
    console.log("New WebSocket connection ");
    socket.on("adduser", username => {
        socket.user = username;
        users.push(username);
        io.sockets.emit("users", users);

        io.to(socket.id).emit("private", {
            id: socket.id,
            name: socket.user,
            msg: "secret message",
        });
    });

    socket.on('message', (message) => {
        console.log(`Received message: ${message}`);
        io.sockets.emit('message', {
            message,
            user: socket.user,
            id: socket.id,
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    })
})


httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})