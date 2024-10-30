const nodeCache = require("node-cache");
const myCache = new nodeCache({stdTTL: 60 * 60 * 24});
const userModel = require("../models/user")
const organizationModel = require("../models/organization")

async function getUserCache(userId) {
    if(!myCache.has(userId)) {
        userModel.getUser(userId)
            .then(
                (userData) => {
                    organizationModel.getUserOrganization(userId)
                    .then(
                        function (organizationData) {
                            userData.organizationId = organizationData[0]._id
                            myCache.set(userId, userData)
                        }
                    ).catch(
                        (organizationErr) => console.log("Organization Error: ", organizationErr)
                    )
                }
            ).catch(
                (userErr) => console.log("User Error: ", userErr)
            )
    }

    return myCache.get(userId)
}

module.exports = { getUserCache }