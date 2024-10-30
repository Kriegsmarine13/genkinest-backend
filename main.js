const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080
const db = require("./src/db/db")
const mongoose = require("mongoose");
const authCheck = require("./src/middleware/authCheck")
const cors = require("cors")
// Routes
const servicesRoutes = require("./src/routes/serviceRoutes")
const loginRoutes = require("./src/routes/loginRoutes")
const userRoutes = require("./src/routes/userRoutes")
const organisationRoutes = require("./src/routes/organisationRoutes")
const eventRoutes = require("./src/routes/eventRoutes")
const galleryRoutes = require("./src/routes/galleryRoutes")
const taskRoutes = require("./src/routes/taskRoutes")

const http = require("http")

db.connect();

app.set('trust proxy', true);
app.use(bodyParser.json())
app.use(cors())

app.use("/", servicesRoutes);

const isAuthenticated = async (req,res,next) => {
    const check = await authCheck(req.headers.accesstoken, req.headers.refreshtoken)
    if (typeof check === 'string' || check instanceof String) {
        res.set({"accessToken": check})
        next();
    } else if (typeof check === 'boolean' || check instanceof Boolean) {
        if (!check) {
            console.log("failed auth check");
            res.status(403).send({status: "Unauthenticated", code: 403})
        }
        next()
    }
}

app.use("/", loginRoutes)

// Routes requiring auth and using isAuthenticated middleware
app.use(isAuthenticated)
app.use(userRoutes, organisationRoutes, eventRoutes, galleryRoutes, taskRoutes)

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB")
})

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})