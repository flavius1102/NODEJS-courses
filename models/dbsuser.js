const mongoose = require('mongoose');

const FelhasznaloSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isadmin: {
        type: Boolean,
        required: true
    }
});

const User = mongoose.model('User', FelhasznaloSchema);

module.exports = User;
