const express = require("express")
const app = express.Router()
const eventModel = require("../models/event")
const eventService = require("../services/eventService")

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

module.exports = app