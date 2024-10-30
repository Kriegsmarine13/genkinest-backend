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
const cors = require("cors")
const eventService = require("./src/services/eventService")
const galleryService = require("./src/services/galleryService")
const multer = require('multer');
const downloadConfig = require("./src/helpers/downloadGoogleConfig")
const memoryStorage = multer.memoryStorage();
const upload = multer({storage: memoryStorage});
const nodeCache = require("node-cache");
const myCache = new nodeCache({stdTTL: 60 * 60 * 24});

const http = require("http")

db.connect();

app.set('trust proxy', true);
app.use(bodyParser.json())
app.use(cors())

// Health checks
app.get('/', (req, res) => {
    res.status(200).json({"test": 'Hello World!'})
})

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// User existence check for chat service
app.get('/api/user/check/:id', (req, res) => {
    if(!myCache.has("userOrg_" + req.params.id)) {
        organizationModel.getUserOrganization(req.params.id).then((organization) => {
            myCache.set("userOrg_" + req.params.id, organization[0]._id)
        }).catch((err) => res.status(500).send(err))
    }
    res.status(200).send(myCache.get("userOrg_" + req.params.id))
})

// Nodeblocks (AppEngine) config required path
app.get('/_ah/start', (req, res) => {
    res.status(200).json({"hello": "world"});
})

// Workaround for Google Cloud Storage config handling
app.get("/download-config", async (req, res) => {
    try {
        await downloadConfig.downloadFile().catch(console.error);
        res.status(200).json({"message": "done!"});
    } catch(err) {
        res.status(500).send(err)
    }
})

const isAuthenticated = async (req,res,next) => {
    const check = await authCheck(req.headers.accesstoken, req.headers.refreshtoken)
    if (typeof check === 'string' || check instanceof String) {
        res.set({"accessToken": check})
    } else if (typeof check === 'boolean' || check instanceof Boolean) {
        if (!check) {
            res.status(403).send({status: "Unauthenticated", code: 403})
        }
    }
    next();
}

app.post('/api/login', (req, res) => {
    let data = req.body
    data.fingerprint = process.env.NB_FINGERPRINT
        axios.post(process.env.NB_AUTH_SERVICE_URL + "/login", data)
            .then((response) => {
                res.set(response.headers)

                res.json({"status": "success", "data": response.data})
            }).catch((err) => {
            console.error(err)
            res.json({"status": "error", "code": err.status})
        })
})

app.post('/api/user', (req, res) => {
    axios.post(process.env.NB_USER_SERVICE_URL + "/users", req.body)
        .then(
            (nbResponse) => organizationModel.newOrganization({
                ownerId: nbResponse.data.id,
                users: [nbResponse.data.id]
            })
            .then(
                (orgResponse) => res.status(200).json({
                    "messages": "success", 
                    "data": {
                        "user": nbResponse.data,
                        "organization": orgResponse
                    }
                })
            ).catch(
                (orgErr) => console.log(orgErr)
            )
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
    ).catch((err) => res.status(500).json({"error": err}))
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



app.post('/api/gallery/', upload.fields([{name: "files", maxCount: 10}]),(req, res) => {
    let data = {
        files: req.files,
        ownerId: req.headers.userid,
    }
    galleryService.uploadMultipleFiles(data.files.files).then(
        (data) => galleryService.createImagesFromUrlArray(req.headers.userid, data)
        .then((response) => res.status(200).json({"message": "Files successfully uploaded and saved", "data": response}))
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

httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})