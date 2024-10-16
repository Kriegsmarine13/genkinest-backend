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
    notify: Boolean, // needs notification?
    /*
    How I see it: [
        {
            userId: 1,
            notificationType: [internal, email],
            notifyTime: "2024-12-31 15:30",
            repeat: true,
            repeatInterval: "15 * 60",
        }
    ]
     */
    notification: Array, //types of notification: ["internal", "email", "sms"]
    description: String,
    start: Date,
    end: Date,
    url: String
})

module.exports = { eventSchema }