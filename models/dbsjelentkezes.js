const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JelentkezesSchema = new Schema({
    //kategoriaid: { type: Schema.Types.ObjectId, ref: 'KategoriaSchema' },
    tanfolyamid: { type: Schema.Types.ObjectId, ref: 'TanfolyamSchema' },
    nev: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    szuletesido: {
      type: Date,
      required: true
    },
    szuleteshely: {
      type: String,
      required: true
    }
});

const Jelentkezes = mongoose.model('Jelentkezes', JelentkezesSchema);

module.exports = Jelentkezes;
