class User {
    constructor(id) {
        this.id = id
    }

    get userId() {
        return this.id
    }

    set userId(userId) {
        this.id = userId
    }
}

// function getUserId()
// {
//     console.log("getUserId")
//     // console.log(user)
//     return user.userId
// }
//
// function setUserId(userId) {
//     console.log("setUserId " + userId)
//     user.userId = userId
//     console.log(user)
// }

module.exports = { User }