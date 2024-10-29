const mongoose = require("mongoose")
const taskSchema = require("../schemas/taskSchema")

const Task = mongoose.model("Task", taskSchema.taskSchema)

async function newTask(data) {
    return Task.create(data)
}

async function getTask(taskId) {
    return Task.findById(taskId).exec()
}

async function updateTask(taskId, data) {
    return Task.findByIdAndUpdate(taskId, data, {new: true}).exec()
}

async function deleteTask(taskId) {
    return Task.findByIdAndDelete(taskId).exec()
}

async function getTasks() {
    return Task.find().exec();
}

async function getTasksForExecutor(userId) {
    return Task.find({
        executorId: userId
    }).exec()
}

async function getTasksForCreator(userId) {
    return Task.find({
        creatorId: userId
    }).exec()
}

async function findTasks(query) {
    return Task.find(query).exec()
}

async function findRelatedTasks(userId) {
    return Task.find().or([
        {
            executorId: userId
        },
        {
            creatorId: userId
        }
    ]).exec()
}

module.exports = { newTask, getTask, updateTask, deleteTask, getTasks, getTasksForCreator, getTasksForExecutor, findTasks, findRelatedTasks }