const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const KategoriaSchema = new Schema({ 
    kategorianeve: {
            type: String,
            required: true
        }
});

const Kategoria = mongoose.model('Kategoria', KategoriaSchema);

module.exports = Kategoria;
