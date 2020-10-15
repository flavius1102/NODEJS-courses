const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const mongoose = require('mongoose');
const db = mongoose.connect('mongodb://localhost:27017/nodevizsga', {useNewUrlParser: true, useUnifiedTopology: true});

// Felhasznaló model betöltése
const User = require('../models/dbsuser');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Kategória model betöltése
const Kategoria = require('../models/dbskategoria');

// Tanfolyam model betöltése
const Tanfolyam = require('../models/dbstanfolyam');

// Jelentkezés model betöltése
const Jelentkezes = require('../models/dbsjelentkezes');

// Login oldal
router.get('/login', forwardAuthenticated, (req, res) => {
    // Admin felhasználó ellenőrzése név és jogosultság flag alapján
    User.findOne({ name: "admin", isadmin: 1 }).then(
        adminfelhasznalo => {
        if (adminfelhasznalo) {
            res.render('login');
        } else {    
            res.render('adminjelszo');
        } 
    })
});

// Jelszó beállítása oldal
router.post('/jelszo', forwardAuthenticated, (req, res) => {
    const { jelszo } = req.body;
    User.findOne({ name: "admin", isadmin: 1 }).then(
        adminfelhasznalo => {
        if (!adminfelhasznalo) {
            const Admin = new User ({
                name: 'admin', password: jelszo, isadmin: 1
            });            
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(Admin.password, salt, (err, hash) => {
                    if (err) throw err;
                    Admin.password = hash;
                    Admin
                        .save()
                        .then(user => {})
                        .catch(err => console.log(err));
                });
            });
            res.render('login');
        } else {    
            res.render('adminjelszo');
        } 
    })
});


// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: 'dashboard',
        failureRedirect: 'login',
        failureFlash: true
    })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'Sikeresen kijelentkezett');
    res.redirect('login');
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    // jelentlezések listázása, két szintű populálás:
    // tanfolyamid alapján tanfolyam neve és a tanfolyamid alatt szereplő
    // kategoriaid alapján a kategória neve
    Jelentkezes.find({}).populate([
        {
            path: 'tanfolyamid',
            model: 'Tanfolyam',
            populate: {
                path: 'kategoriaid',
                model: 'Kategoria',
                select: 'kategorianeve'
            }
        }
     ]).exec(function (err, jelentkezes) {
        // tanfolyam jelentkezéseket egy szinten tartalmazó JSON objektum
        let jelentkezesek = [];
        // feltöltés, populált mezők (kategória neve és tanfolyam neve) és jelentkezők egy szintre hozása
        for (let i=0; i < jelentkezes.length; i++) {
            jelentkezesek.push({
                kategorianeve: jelentkezes[i].tanfolyamid.kategoriaid.kategorianeve,
                tanfolyamneve: jelentkezes[i].tanfolyamid.tanfolyamneve,
                nev: jelentkezes[i].nev,
                email: jelentkezes[i].email,
                szuleteshely: jelentkezes[i].szuleteshely,
                szuletesido: jelentkezes[i].szuletesido
            });

        }
        // rendezés kategória neve és azon belül tanfolyam neve alapján
        jelentkezesek.sort(function(a,b){
            astr = a.kategorianeve + a.tanfolyamneve;
            bstr = b.kategorianeve + b.tanfolyamneve;
            return astr > bstr ? 1 : -1;
        })
        res.render('dashboard', {
            user: req.user,
            err,
            jelentkezesek
        })
    })

});

/// Kategória oldal
router.get('/kategoriak', ensureAuthenticated, (req, res) => {
    Kategoria.find({}).exec((err, result) => {
        if (err) {
            return console.log(err);
        } else {
            res.render('kategoriak', {
                kategoriak: result
            });
        }     
        });
    });

// Tanfolyam oldal
router.get('/tanfolyamok', ensureAuthenticated, (req, res) => {
    Kategoria.aggregate([
        { $lookup:
                { from: 'tanfolyams',
                    localField: '_id' ,
                    foreignField: 'kategoriaid',
                    as: 'kategoriatanfolyam'
                }
            }
    ]).exec((err, result) => {

        if (err) {
            return console.log(err);
        } else {
            res.render('tanfolyamok', {
                kattanf: result
            });
        }     
        });
    });

// Kategória felvétele
router.post('/kategoriak', ensureAuthenticated, (req, res) => {
    const { kategorianeve } = req.body;
    let errors = [];

    if (!kategorianeve) {
        errors.push({ msg: 'Kérem, írja be a kategória nevét!' });
    }

    if (errors.length > 0) {
        res.render('kategoriak', {
            errors,
            kategorianeve
        });
    } else {
        Kategoria.findOne({ kategorianeve: kategorianeve }).then((kategoria) => {
            if (kategoria) {
                errors.push({ msg: 'Ez a kategória már létezik: '+ kategorianeve });
                Kategoria.find({}).exec((err, result) => {
                    if (err) {
                        return console.log(err);
                    } else {
                        res.render('kategoriak', {
                            errors,
                            kategoriak: result
                        });
                    }     
                });
            } else {
                const newKategoria = new Kategoria({kategorianeve});
                newKategoria
                    .save()
                    .then(kategoria => {
                        req.flash(
                            'success_msg',
                            'Kategória felvétele sikeres.'
                        );
                        res.redirect('kategoriak');
                    })
                    .catch(err => console.log(err));
            }
        })
        .catch(err => console.log(err));
    }
});

// Tanfolyam felvétele
router.post('/tanfolyamok', ensureAuthenticated, (req, res) => {
    const { kategoriaid, tanfolyamneve } = req.body;
    let errors = [];

    if (!tanfolyamneve) {
        errors.push({ msg: 'Kérem, írja be a tanfolyam nevét!' });
    }

    if (errors.length > 0) {
        res.render('tanfolyamok', {
            errors,
            tanfolyamneve
        });
    } else {
        Tanfolyam.findOne({ kategoriaid: kategoriaid, tanfolyamneve: tanfolyamneve }).then(tanfolyam => {
            if (tanfolyam) {
                errors.push({ msg: 'Ez a tanfolyam már létezik: ' + tanfolyam.tanfolyamneve });
                Kategoria.aggregate([
                    { $lookup:
                            { from: 'tanfolyams',
                                localField: '_id' ,
                                foreignField: 'kategoriaid',
                                as: 'kategoriatanfolyam'
                            }
                        }
                ]).exec((err, result) => {
                    if (err) {
                        return console.log(err);
                    } else {
                        res.render('tanfolyamok', {
                            kattanf: result,
                            errors
                        });
                    }     
                });

            } else {
                const newTanfolyam = new Tanfolyam({kategoriaid, tanfolyamneve});
                newTanfolyam
                    .save()
                    .then(tanfolyam => {
                        req.flash(
                            'success_msg',
                            'Tanfolyam felvétele sikeres.'
                        );
                        res.redirect('tanfolyamok');
                    })
                    .catch(err => console.log(err));
            }
        });
    }
});

module.exports = router;
