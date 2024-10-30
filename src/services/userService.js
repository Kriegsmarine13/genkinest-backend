const organizationModel = require("../models/organization")
const userModel = require("../models/user")

async function addUserToFamily(organizationId, usersArr) {
    let organization = await organizationModel.getOrganization(organizationId);
    await userModel.updateUser({customFields: {familyId: organizationId}})
    return organizationModel.updateOrganization(organizationId, {
        users: organization.users.length > 1 ? organization.users.concat(usersArr.filter((item) => organization.users.indexOf(item) < 0)) : usersArr
    })
}

module.exports = { addUserToFamily }