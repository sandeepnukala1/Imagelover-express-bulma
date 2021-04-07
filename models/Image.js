const { Schema, model } = require('../db/connection')


const ImageSchema = new Schema({
    url: {type: String}
})

const UserSchema = new Schema({
    username: {type: String},
    password: {type: String, required: true},
    images: [ImageSchema]
})

const User = model("user", UserSchema)

module.exports = User