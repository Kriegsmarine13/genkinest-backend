const mongoose = require('mongoose');
const { Schema } = mongoose;

const gallerySchema = new Schema({
    title: String,
    description: String,
    filename: String,
    ownerId: String,
    isPublic: Boolean,
    createdAt: Date,
    updatedBy: String,
    organizationId: String,
})

module.exports = { gallerySchema }