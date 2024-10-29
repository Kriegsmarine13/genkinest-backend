const galleryModel = require('../models/gallery');
const userModel = require('../models/user');
const organizationModel = require('../models/organization')
const { Storage } = require('@google-cloud/storage');
const { join, sep } = require("path");
// const keyfilename = "./bionic-flux-436408-e2-aa3dda0193df.json";
const projectId = "bionic-flux-436408-e2";
console.log(join(process.env.PRIVATE_KEY_1 + process.env.PRIVATE_KEY_2 + process.env.PRIVATE_KEY_3 + process.env.PRIVATE_KEY_4).replace(/\\n/g,"\n"))
const storage = new Storage({
    projectId: projectId, 
    credentials:{
        "type": process.env.TYPE,
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PRIVATE_KEY_ID,
        "private_key": join(process.env.PRIVATE_KEY_1 + process.env.PRIVATE_KEY_2 + process.env.PRIVATE_KEY_3 + process.env.PRIVATE_KEY_4).replace(/\\n/g,"\n"),
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": process.env.AUTH_URI,
        "token_uri": process.env.TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
        "universe_domain": process.env.UNIVERSE_DOMAIN
      }})
const { v4: uuidv4 } = require('uuid');

async function handleFiles(data) {
    if(Object.hasOwn(data.files, "file")) {
        // console.log("single file");
        // console.log(typeof data.files.file[0].buffer);
        data.filename = uuidv4();
        console.log(data);
        data.url = await handleFilesCloud(data.files.file[0].buffer, data.filename, data.files.file[0].mimetype)

        return galleryModel.newImage(data)
    }
    // console.log("multiple files")

    return uploadMultipleFiles(data.files.files);
}

async function uploadFileToGCS(file) {
    // console.log("uploadFileToGCS");
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
    // console.log("uploadMultipleFiles")
    const uploadPromises = files.map((file) => uploadFileToGCS(file));
    return Promise.all(uploadPromises);
  }

async function createImagesFromUrlArray(userId, urlArray) {
    // console.log("createImagesFromUrlArray");
    // console.log(urlArray)
    let result = [];
    await organizationModel.getUserOrganization(userId)
    .then((organization) => {
        // console.log(organization)
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
    // console.log(userId)
    let organizationId = await organizationModel.getUserOrganization(userId)
    // console.log(organizationId)
    return galleryModel.getOrganizationImages(organizationId[0]._id);
}

module.exports = { handleFiles, getUserImages, uploadMultipleFiles, createImagesFromUrlArray, getFamilyImages };