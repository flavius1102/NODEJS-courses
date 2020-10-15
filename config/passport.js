const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// User model betöltése
const User = require('../models/dbsuser');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'name' }, (name, password, done) => {
            // Match user
            User.findOne({
                name: name
            }).then(user => {
                if (!user) {
                    return done(null, false, { message: 'Ez a név nincs regisztrálva!' });
                }

                // Match password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Nem megfelelő név vagy jelszó.' });
                    }
                });
            });
        })
    );

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
};
