const mongoose = require('mongoose');
const gallerySchema = require('../schemas/gallerySchema');

const Gallery = mongoose.model("Gallery", gallerySchema.gallerySchema);

async function newImage(data) {
    return Gallery.create(data);
}

async function getImage(imageId) {
    return Gallery.findById(imageId).exec();
}

async function deleteImage(imageId) {
    return Gallery.findByIdAndDelete(imageId).exec();
}

async function getPrivateImages(userId) {
    return Gallery.find({ownerId: userId}).exec();
}

async function getOrganizationImages(organizationId) {
    return Gallery.find({organizationId: organizationId}).exec();
}

module.exports = { newImage, getImage, deleteImage, getPrivateImages, getOrganizationImages }