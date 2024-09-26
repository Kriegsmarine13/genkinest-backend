const mongoose = require('mongoose')
require("dotenv").config({path: "../../.env"})

const connect = async() => {
    try {
        console.log("DATABASE_URL: " + process.env.DATABASE_URL)
        await mongoose.connect(process.env.DATABASE_URL);
    } catch(err) {
        console.error(err)
    }
}

module.exports = {connect}