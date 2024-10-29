const mongoose = require("mongoose");
const { Schema } = mongoose
const taskSchema = new Schema({
    id: String,
    title: String,
    description: String,
    reward: Number,
    creatorId: String,
    executorId: String,
    deadline: Date,
    subtasks: Array,
    createdAt: Date,
})

module.exports = { taskSchema }