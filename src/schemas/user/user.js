const mongoose = require("mongoose")
const userSchema = require("./userSchema")
const hashPassword = require("../../utils/hashPassword")

const User = mongoose.model("User", userSchema.userSchema)

async function newUser(data) {
    data.password = await hashPassword.passwordBcrypt(data.password)
    const result = await User.create(data);
    return !!result;

}

async function getUsers() {
    return User.find().exec();
}

module.exports = { newUser, getUsers }