const express = require('express')
const bodyParser = require('body-parser')
const axios = require("axios")
const app = express()
const port = process.env.PORT || 8080
const userModel = require("./src/models/user")
const galleryModel = require("./src/models/gallery")
const eventModel = require("./src/models/event")
const organizationModel = require("./src/models/organization")
const taskModel = require("./src/models/task")
const db = require("./src/db/db")
const mongoose = require("mongoose");
const authCheck = require("./src/middleware/authCheck")
const { User } = require("./src/middleware/user")
const cors = require("cors")
const eventService = require("./src/services/eventService")
const galleryService = require("./src/services/galleryService")
const multer = require('multer');
const downloadConfig = require("./src/helpers/downloadGoogleConfig")
const { randomBytes } = require("node:crypto")
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + "/public/uploads")
    },
    filename: function (req, file, cb) {
        let ext;
        switch(file.mimetype) {
            case 'image/png':
                ext = ".png"
                break;
            case 'image/jpg':
                ext = ".jpeg"
                break;
            case 'image/jpeg':
                ext = ".jpeg"
                break;
            case 'image/svg':
                ext = ".svg"
                break;

            default:
                break;
        }
        cb(null, randomBytes(16).toString("hex") + ext)
    }
})
const memoryStorage = multer.memoryStorage();
const upload = multer({storage: memoryStorage});
const nodeCache = require("node-cache");
const myCache = new nodeCache({stdTTL: 60 * 15});

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

app.get('/api/user/check/:id', (req, res) => {
    organizationModel.getUserOrganization(req.params.id).then((organization) => {
        // console.log(organization[0]._id)
        res.status(200).send(organization[0]._id);
    }).catch((err) => res.status(500).send(err))
})

// <- GIGA IMPORTANT ->
app.get('/_ah/start', (req, res) => {
    res.status(200).json({"hello": "world"});
})
// <- GIGA IMPORTANT -/>

app.use(express.static("./static"))
app.get("/test-chat", (req, res) => {
    res.sendFile("./static/index.html", {root: __dirname})
})

app.get("/download-config", async (req, res) => {
    try {
        await downloadConfig.downloadFile().catch(console.error);
        res.status(200).json({"message": "done!"});
    } catch(err) {
        res.status(500).send(err)
    }
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
    // let hrTime = process.hrtime()
    // let startTime = process.hrtime.bigint()
    // console.log("Time before post to auth service: " + startTime)
        axios.post(process.env.NB_AUTH_SERVICE_URL + "/login", data)
            .then((response) => {
                // console.log("[SUPPOSINGLY] Time after resolving data from auth service: " + (process.hrtime.bigint() - startTime))
                if(myCache.has(response.data.userId)) {
                    // console.log("Time to check for cache: " + (process.hrtime.bigint() - startTime))
                    userData = myCache.get(response.data.userId);
                    // console.log("Time to get cache: " + (process.hrtime.bigint() - startTime))
                    // console.log("cahched data used")
                    // console.log(userData)
                }
                if(userData == undefined) {
                    userModel.getUser(response.data.userId)
                        .then((res) => {
                            // let resolveUserTime = process.hrtime.bigint()
                            // console.log()
                            userData = res;
                            // console.log(userData);
                            // let getUserTime = process.hrtime.bigint();
                            // console.log("Time to get User from database: " + (getUserTime - startTime))
                            myCache.set(response.data.userId, userData);
                            // let setCacheTime = process.hrtime.bigint();
                            // console.log("Time to set cache for User: " + (setCacheTime - startTime))
                        });
                    // console.log("data cached! Getting from cache to check...")
                    // console.log(myCache.get(response.data.userId))
                }

                // userData = new User(response.data.userId)
                // console.log(response.headers)
                res.set(response.headers)
                // let beforeSendTime = process.hrtime.bigint();
                // console.log("Time before sending data: " + (beforeSendTime - startTime))
                // console.log("--------------------------------------")

                res.json({"status": "success", "data": response.data})
            }).catch((err) => {
            console.error(err)
            res.json({"status": "error", "code": err.status})
        })
})

app.post('/api/user', (req, res) => {
    axios.post(process.env.NB_USER_SERVICE_URL + "/users", req.body)
        .then(
            (nbResponse) => res.status(200).json(nbResponse.data)
        ).catch(
            (err) => console.log(err)
        )
    
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
    req.body.createdBy = req.headers.userid
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
    eventModel.getEventsForUser(req.headers.userid).then(
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
        organizationModel.updateOrganization(req.params.id, req.body).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        organizationModel.deleteOrganization(req.params.id).then(
            (data) => res.status(200).json({"message": "Organization deleted", "info": data})
        ).catch((err) => res.status(500).json({"error": err}))
    })

app.route('/api/event/:id')
    .get((req, res) => {
        eventModel.getEvent(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .put((req, res) => {
        eventModel.updateEvent(req.params.id, req.body).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        eventModel.deleteEvent(req.params.id).then(
            (data) => res.status(200).json({"message": "Organization deleted", "info": data})
        ).catch((err) => res.status(500).json({"error": err}))
    })

app.route('/api/gallery/:id')
    .get((req, res) => {
        galleryModel.getImage(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        galleryModel.deleteImage(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })

app.get('/api/gallery', (req, res) => {
    galleryService.getFamilyImages(req.headers.userid).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).json({"error": err}))
})

// app.get('/api/gallery', (req, res) => {
//     galleryService.getUserImages(userData.id).then(
//         (data) => res.status(200).json(data)
//     ).catch((err) => res.status(500).json({"error": err}))
// })


app.post('/api/gallery/', upload.fields([{name: "files", maxCount: 10}]),(req, res) => {
    // console.log(req.headers.userid)
    let data = {
        files: req.files,
        ownerId: req.headers.userid,
    }
    // console.log(data);
    galleryService.uploadMultipleFiles(data.files.files).then(
        (data) => galleryService.createImagesFromUrlArray(req.headers.userid, data)
        .then((response) => res.status(200).json({"message": "Files successfully uploaded and saved", "data": response}))
        // (data) => res.status(200).json({"message": "Files successfully uploaded!", "data": data})
    ).catch((err) => res.status(500).json({"error": err}))
})

app.post('/api/task', (req, res) => {
    taskModel.newTask(req.body).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).send(err))
})

app.route('/api/task/:id')
    .get((req, res) => {
        taskModel.getTask(req.params.id)
        .then((data) => res.status(200).json(data))
        .catch((err) => res.status(500).send(err))
    })
    .put((req, res) => {
        taskModel.updateTask(req.params.id, req.body)
        .then((data) => res.status(200).json(data))
        .catch((err) => res.status(500).send(err))
    })
    .delete((req, res) => {
        taskModel.deleteTask(req.params.id)
        .then((data) => res.status(200).json(data))
        .catch((err) => res.status(500).send(err))
    })

app.get('/api/tasks', (req, res) => {
    taskModel.findRelatedTasks(req.headers.userid)
    .then((data) => res.status(200).json(data))
    .catch((err) => res.status(500).json(err))
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
// io.on('connection', (socket) => {
//     console.log("New WebSocket connection ");
//     socket.on("adduser", username => {
//         socket.user = username;
//         users.push(username);
//         io.sockets.emit("users", users);

//         io.to(socket.id).emit("private", {
//             id: socket.id,
//             name: socket.user,
//             msg: "secret message",
//         });
//     });

//     socket.on('message', (message) => {
//         console.log(`Received message: ${message}`);
//         io.sockets.emit('message', {
//             message,
//             user: socket.user,
//             id: socket.id,
//         });
//     });

//     socket.on('disconnect', () => {
//         console.log('Client disconnected');
//     })
// })


httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})