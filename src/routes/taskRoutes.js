const express = require("express")
const app = express.Router()
const taskModel = require("../models/task")

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

module.exports = app