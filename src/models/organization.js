const mongoose = require("mongoose")
const organizationSchema = require("../schemas/organizationSchema")

const Organization = mongoose.model("Organization", organizationSchema.organizationSchema);

async function newOrganization(data) {
    return Organization.create(data)
}

async function getOrganization(OrganizationId) {
    return Organization.findById(OrganizationId).exec()
}

async function updateOrganization(OrganizationId, data) {
    return Organization.findByIdAndUpdate(OrganizationId, data, {new:true}).exec();
}

async function deleteOrganization(OrganizationId) {
    return Organization.findByIdAndDelete(OrganizationId).exec();
}

async function getOrganizations() {
    return Organization.find().exec();
}

module.exports = { newOrganization, getOrganization, updateOrganization, deleteOrganization, getOrganizations }