const mongoose = require("mongoose")
const { Schema } = mongoose;

const organizationSchema = new Schema({
    addressLine1: String,
    addressLine2: String,
    addressLine3: String,
    ancestorIds: Array,
    auditStatus: String,
    branchName: String,
    certificateImageId: String,
    childrenCount: Number,
    createdAt: Date,
    customFields: Object,
    delFlg: Number,
    depth: Number,
    iconImageId: String,
    id: String,
    logoImageId: String,
    name: String,
    numberOfProjects: String,
    parentId: String,
    phoneNumber: String,
    pictureUrl: String,
    postalCode: String,
    qualifications: Array,
    reviewStats: Object,
    size: String,
    status: String,
    typeId: String,
    updatedAt: Date,
    url: String,
    users: Array,
    ancestorNamePath: String,
    certifiedQualifications: Array,
    description: String,
    ownerId: String
})

module.exports = { organizationSchema }