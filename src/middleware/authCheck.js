const axios = require("axios")

async function isAuthenticated(accessToken, refreshToken) {
    // console.log("middleware activated")
    // console.log("accessToken is " + accessToken)
    // console.log("refreshToken is " + refreshToken)
    let data = {
        token: accessToken,
        fingerprint: process.env.NB_FINGERPRINT,
        target: "/"
    }
    return await axios.post(process.env.NB_AUTH_SERVICE_URL + "/check-token", data)
        .then((response) => {
            // console.log("accessToken used")

            return true;
        }).catch(async (err) => {
            // console.log("accessToken is not valid")
            data = {
                refreshToken: refreshToken,
                fingerprint: process.env.NB_FINGERPRINT
            }
            return await axios.post(process.env.NB_AUTH_SERVICE_URL + "/refresh-access-token", data)
                .then((response) => {
                    // console.log("refreshToken used")
                    // console.log(response.data)

                    return response.data.accessToken;
                })
                .catch((err) => {
                    // console.log("refreshToken is not valid")
                    // console.log(err)

                    return false;
                });
    })
}

module.exports = isAuthenticated