const mongoose = require("mongoose")
const userSchema = require("../schemas/userSchema")
const hashPassword = require("../utils/hashPassword")

const User = mongoose.model("User", userSchema.userSchema)

async function newUser(data) {
    data.password = await hashPassword.passwordBcrypt(data.password)
    const result = await User.create(data);
    return !!result;

}

async function getUser(userId) {
    console.log(userId)
    console.log(await User.findById(userId).exec())
    return User.findById(userId).exec()
}

async function updateUser(userId, data) {
    return User.findByIdAndUpdate(userId, data, {new:true}).exec();
}

async function deleteUser(userId) {
    return User.findByIdAndDelete(userId).exec();
}

async function getUsers() {
    return User.find().exec();
}

module.exports = { newUser, getUsers, getUser, updateUser, deleteUser }