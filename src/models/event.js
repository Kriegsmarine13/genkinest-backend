const mongoose = require("mongoose")
const eventSchema = require("../schemas/eventSchema")

const Event = mongoose.model("Event", eventSchema.eventSchema)

async function newEvent(data) {
    return Event.create(data)
}

async function getEvent(eventId) {
    return Event.findById(eventId).exec()
}

async function updateEvent(eventId, data) {
    return Event.findByIdAndUpdate(eventId, data).exec()
}

async function deleteEvent(eventId) {
    return Event.findByIdAndDelete(eventId).exec()
}

async function getEvents() {
    return Event.find().exec();
}

async function getEventsForUser(userId) {
    return Event.find({
        participants: {
            $in: userId
        }
    }).or(
        {
            createdBy: userId
        }
    )
}

module.exports = { newEvent, getEvent, updateEvent, deleteEvent, getEvents, getEventsForUser }