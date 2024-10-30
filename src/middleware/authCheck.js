const axios = require("axios")
const user = require("./user")
const {User} = require("./user");

async function isAuthenticated(accessToken, refreshToken) {
    let data = {
        token: accessToken,
        fingerprint: process.env.NB_FINGERPRINT,
        target: "/"
    }
    return await axios.post(process.env.NB_AUTH_SERVICE_URL + "/check-token", data)
        .then((response) => {
            const user = new User(response.data.userId)
            return true;
        }).catch(async (err) => {
            data = {
                refreshToken: refreshToken,
                fingerprint: process.env.NB_FINGERPRINT
            }
            return await axios.post(process.env.NB_AUTH_SERVICE_URL + "/refresh-access-token", data)
                .then((response) => {
                    return response.data.accessToken;
                })
                .catch((err) => {
                    return false;
                });
    })
}

module.exports = isAuthenticated