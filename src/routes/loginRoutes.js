const express = require("express")
const app = express.Router()
const axios = require("axios")

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

module.exports = app