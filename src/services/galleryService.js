const galleryModel = require('../models/gallery');
const userModel = require('../models/user');
const organizationModel = require('../models/organization')
const { Storage } = require('@google-cloud/storage');
const keyfilename = "./src/services/bionic-flux-436408-e2-797f2655a655.json";
const projectId = "bionic-flux-436408-e2";
const storage = new Storage({projectId: projectId, keyFilename: keyfilename})

async function uploadFileToGCS(file) {
    const bucketName = "hackizumo-team2";
    const bucket = storage.bucket(bucketName);
    const storagePath = `public/images/${Date.now() + file.originalname}`

    const blob = bucket.file(storagePath);
    const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
    });
  
    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', () => resolve(`https://storage.googleapis.com/${bucketName}/${storagePath}`));
      blobStream.end(file.buffer);
    });
  }
  
  // Function to upload multiple files
  async function uploadMultipleFiles(files) {
    const uploadPromises = files.map((file) => uploadFileToGCS(file));
    return Promise.all(uploadPromises);
  }

async function createImagesFromUrlArray(userId, urlArray) {
    let result = [];
    await organizationModel.getUserOrganization(userId)
    .then((organization) => {
        urlArray.forEach(async (imgUrl) => {
            result.push(
                galleryModel.newImage({
                    ownerId: userId,
                    url: imgUrl,
                    organizationId: organization[0]._id
                })
            )
        })
    })

    return Promise.all(result);
}

async function getUserImages(userId) {
    let userImages = {};

    userImages.private = await galleryModel.getPrivateImages(userId)
    let user = await userModel.getUser(userId)
    userImages.public = await galleryModel.getOrganizationImages(user.organizationId)

    return userImages;
}

async function getFamilyImages(userId) {
    let organizationId = await organizationModel.getUserOrganization(userId)
    return galleryModel.getOrganizationImages(organizationId[0]._id);
}

module.exports = { getUserImages, uploadMultipleFiles, createImagesFromUrlArray, getFamilyImages };