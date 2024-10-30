const express = require("express")
const app = express.Router()
const galleryService = require("../services/galleryService")
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({storage: memoryStorage});
const galleryModel = require("../models/gallery")

app.route('/api/gallery/:id')
    .get((req, res) => {
        galleryModel.getImage(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })
    .delete((req, res) => {
        galleryModel.deleteImage(req.params.id).then(
            (data) => res.status(200).json(data)
        ).catch((err) => res.status(500).json({"error": err}))
    })

app.get('/api/gallery', (req, res) => {
    galleryService.getFamilyImages(req.headers.userid).then(
        (data) => res.status(200).json(data)
    ).catch((err) => res.status(500).json({"error": err}))
})

app.post('/api/gallery/', upload.fields([{name: "files", maxCount: 10}]),(req, res) => {
    let data = {
        files: req.files,
        ownerId: req.headers.userid,
    }
    galleryService.uploadMultipleFiles(data.files.files).then(
        (data) => galleryService.createImagesFromUrlArray(req.headers.userid, data)
        .then((response) => res.status(200).json({"message": "Files successfully uploaded and saved", "data": response}))
    ).catch((err) => res.status(500).json({"error": err}))
})

module.exports = app