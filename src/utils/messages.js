const generateMessage = (msg, username) => {
    return {
        msg,
        createdAt: new Date().getTime(),
        username
    }
}

const generateLocationMessage = (url, username) => {
    return {
        url,
        createdAt: new Date().getTime(),
        username
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}