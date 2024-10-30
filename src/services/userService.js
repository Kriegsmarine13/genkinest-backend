const organizationModel = require("../models/organization")
const userModel = require("../models/user")

async function addUserToFamily(organizationId, usersArr) {
    let organization = await organizationModel.getOrganization(organizationId);
    // console.log(organization)
    await userModel.updateUser(usersArr, {customFields: {familyId: organizationId}})
    return organizationModel.updateOrganization(organizationId, {
        users: Array.isArray(usersArr) ? (organization.users.length > 1 ? organization.users.concat(usersArr.filter((item) => organization.users.indexOf(item) < 0)) : usersArr) : organization.users.concat(usersArr)
    })
}

module.exports = { addUserToFamily }