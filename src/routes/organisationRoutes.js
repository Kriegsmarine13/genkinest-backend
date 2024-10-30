const express = require("express")
const app = express.Router()
const organizationModel = require("../models/organization")

app.post('/api/organization', (req, res) => {
    organizationModel.newOrganization(req.body).then(
        (data) => res.status(200).json(data)
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

module.exports = app