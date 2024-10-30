const express = require("express")
const app = express.Router()
const userModel = require("../models/user")

app.get('/api/users', (req,res) => {
    userModel.getUsers().then(
        (result) => res.json(result)
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

module.exports = app