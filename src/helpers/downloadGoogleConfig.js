const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

async function downloadFile() {
    const options = {
        destination: "/tmp/bionic-flux-436408-e2-797f2655a655.json"
    }

    await storage.bucket("izumo-team2").file("bionic-flux-436408-e2-797f2655a655.json").download(options);
    // console.log()
}

module.exports = { downloadFile }