// require("../../db/db")
const mongoose = require("mongoose")
const { Schema } = mongoose;


const userSchema = new Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    addressLine1: String,
    createdAt: Date,
    delFlg: Number,
    failedAttempts: Number,
    id: String,
    name: String,
    updatedAt: Date,
    addressLine2: String,
    customFields: Object,
    email: String,
    isLocked: Boolean,
    password: String,
    addressLine3: String,
    emailVerified: Boolean,
    phoneNumber: String,
    avatar: String,
    postalCode: String,
    preferences: Array,
    provider: String,
    providerId: String,
    reviewStats: Object,
    typeId: String
})

module.exports = { userSchema }