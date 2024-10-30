const mongoose = require("mongoose")
const { Schema } = mongoose

const eventSchema = new Schema({
    organizationId: String,
    id: String,
    title: String,
    createdBy: String,
    updatedBy: String,
    isPublic: Boolean,
    participants: Array,
    confirmedParticipants: Array,
    customFields: Object,
    notify: Boolean,
    notification: Array,
    description: String,
    start: Date,
    end: Date,
    url: String
})

module.exports = { eventSchema }