const organizationModel = require("../models/organization")

async function addUserToFamily(organizationId, usersArr) {
    let organization = await organizationModel.getOrganization(organizationId);
    // console.log(organization)
    return organizationModel.updateOrganization(organizationId, {
        users: organization.users.length > 1 ? organization.users.concat(usersArr.filter((item) => organization.users.indexOf(item) < 0)) : usersArr
    })
}

module.exports = { addUserToFamily }