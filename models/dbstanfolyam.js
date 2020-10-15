const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TanfolyamSchema = new Schema({
    kategoriaid: { type: Schema.Types.ObjectId, ref: 'KategoriaSchema' },
    tanfolyamneve: {
        type: String,
        required: true
    }
});

const Tanfolyam = mongoose.model('Tanfolyam', TanfolyamSchema);

module.exports = Tanfolyam;
