const express = require("express")
const app = express.Router()
const downloadConfig = require("../helpers/downloadGoogleConfig")
const organizationModel = require("../models/organization")
const userModel = require("../models/user")
const eventModel = require("../models/event")
const userService = require("../services/userService")
const nodeCache = require("node-cache");
const myCache = new nodeCache({stdTTL: 60 * 60 * 24});
// const bodyParser = require('body-parser')
const axios = require("axios")

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
app.get('/_ah/start', async (req, res) => {
    console.log("/_ah/start endpoint called")
    try {
        await downloadConfig.downloadFile().catch(console.error);
        res.status(200).json({"message": "done!", "hello": "world"});
    } catch(err) {
        res.status(500).send(err)
    }
    // res.status(200).json({"hello": "world"});
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

app.get('/api/organization/events', (req, res) => {
    eventModel.getEvents(req.headers.organizationid)
    .then(
        (events) => res.status(200).json(events)
    ).catch(
        (eventErr) => console.log(eventErr)
    )
})

app.post('/api/user', (req, res) => {
    axios.post(process.env.NB_USER_SERVICE_URL + "/users", req.body)
        .then(
            (nbResponse) => organizationModel.newOrganization({
                ownerId: nbResponse.data.id,
                users: [nbResponse.data.id]
            })
            .then(
                (orgResponse) => userModel.updateUser(nbResponse.data.id, {customFields: {familyId: orgResponse._id}})
                .then(
                    (updatedUser) => res.status(200).json({
                        "message": "success",
                        "data": {
                            "user": updatedUser,
                            "organization": orgResponse
                        }
                    })
                ).catch((updatedUserErr) => console.log(updatedUserErr))
            ).catch(
                (orgErr) => console.log(orgErr)
            )
        ).catch(
            (err) => console.log(err)
        )
})

// Test demo route for guest registration 
app.post('/api/user/demo', (req, res) => {
    axios.post(process.env.NB_USER_SERVICE_URL + "/users", {
        name: req.body.name, 
        password: "test1234", 
        typeId: "010", 
        email: (Math.random() + 1).toString(36).substring(7) + "@gmail.com"}
    )
    .then(
        (demoUser) => userService.addUserToFamily("6721f15c3b902e09998d8620", demoUser.data.id)
        .then(
            (result) => res.status(200).json({
                "message": "success", 
                "data": {
                    "user": demoUser.data,
                    "organization": result
                }
            })
        ).catch((orgErr) => console.log("Organization Error: ", orgErr))
    ).catch((userErr) => console.log("User Error: ", userErr));
})

module.exports = app