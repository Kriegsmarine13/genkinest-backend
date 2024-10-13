const eventModel = require("../models/event")

async function inviteUsers(eventId, users) {
    let event = await eventModel.getEvent(eventId);
    return eventModel.updateEvent(eventId, {
        participants: event.participants.concat(users.filter((item) => event.participants.indexOf(item) < 0))
    })
}

module.exports = { inviteUsers }