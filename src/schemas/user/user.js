const mongoose = require("mongoose")
const userSchema = require("./userSchema")
const User = mongoose.model("User", userSchema.userSchema)

async function newUser(data) {
    const result = await User.create(data);
    if (result) {
        return true;
    }
    return false;
}

async function getUsers() {
    return User.find().exec();
}

module.exports = { newUser, getUsers }