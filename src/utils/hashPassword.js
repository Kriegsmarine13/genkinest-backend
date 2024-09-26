const bcrypt = require("bcrypt")

const saltRounds = 10

async function passwordBcrypt(password) {
    return bcrypt
        .genSalt(saltRounds)
        .then(salt => {
            return bcrypt.hash(password, salt)
        })
        .then(hash => {
            return hash
        })
        .catch(err => console.error(err))
}

module.exports = { passwordBcrypt }