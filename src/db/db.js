const mongoose = require('mongoose')
require("dotenv").config({path: "../../.env"})

const connect = async() => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
    } catch(err) {
        console.error(err)
    }
}

module.exports = {connect}