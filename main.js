const express = require('express')
const bodyParser = require('body-parser')
const axios = require("axios")
const app = express()
const port = 80

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.json({"test": 'Hello World!'})
})

app.get('/api/login', (req, res) => {
    let data = {"email":"vladimir.backend@gmail.com","password":"Password123","fingerprint":"69adc8446318cabc826d9b66748c1929"}
    axios.post("https://nbc-ud20j1ht4hbq37lip3g73o12.an.r.appspot.com/login", data)
        .then((response) => {
            console.log(response.headers)
            res.set(response.headers)
            // res.cookie("accessToken", response.data.accessToken)

            res.json({"status": "success"})
        }).catch((err) => {
            console.error(err)
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})