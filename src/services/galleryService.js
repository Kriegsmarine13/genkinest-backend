const galleryModel = require('../models/gallery');
const userModel = require('../models/user');

async function handleFiles(data) {
    if(Object.hasOwn(data.files, "file")) {
        data.filename = data.files.file[0].filename;

        return galleryModel.newImage(data)
    }
}

async function getUserImages(userId) {
    let userImages = {};

    userImages.private = await galleryModel.getPrivateImages(userId)
    let user = await userModel.getUser(userId)
    userImages.public = await galleryModel.getOrganizationImages(user.organizationId)

    return userImages;
}

module.exports = { handleFiles, getUserImages };