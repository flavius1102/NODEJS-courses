const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const mongoose = require('mongoose');
const db = mongoose.connect('mongodb://localhost:27017/nodevizsga', {useNewUrlParser: true, useUnifiedTopology: true});

// Kategória model betöltése
const Kategoria = require('../models/dbskategoria');

// Tanfolyam model betöltése
const Tanfolyam = require('../models/dbstanfolyam');

// Jelentkezes model betöltése
const Jelentkezes = require('../models/dbsjelentkezes');

// Welcome Page
router.get('/admin', forwardAuthenticated, (req, res) => res.render('admin'));


// Felvett tanfolyamok oldal
router.get('/', (req, res) => {
    
    Kategoria.aggregate([
        { $lookup:
                { from: 'tanfolyams',
                    localField: '_id' ,
                    foreignField: 'kategoriaid',
                    as: 'kategoriatanfolyam'
                }
            }
    ]).exec((err, result) => {
        if(err) {
            return console.log(err);
        } else {
            res.render('index', {
                tanfolyamok: result
            });
        }
        });
});


router.post('/jelentkezes', (req, res) => {
    const { tanfolyamid } = req.body;
    let errors = [];
    
    if (!tanfolyamid) {
        errors.push({ msg: 'Kérem, kérem válasszon tanfolyamot!' });
    }

    if (errors.length > 0) {
        res.render('jelentkezes', {
            errors,
            tanfolyamid
        });
    } else {
        Tanfolyam.findOne({_id: tanfolyamid}).populate({ path: 'kategoriaid', model: Kategoria }).exec(function (err, tanfolyam) {
            
            if (err || (!tanfolyam)) {
                 res.redirect('/', {
                });
            }
            
            res.render('jelentkezes', {
                errors,
                tanfolyam
           });
        });
    }
});

router.post('/mentes', (req, res) => {    
    const { tanfolyamid,nev,email,szuletesido,szuleteshely } = req.body;
    let errors = [];
    
    if ((!tanfolyamid) || (!nev) || (!email) || (!szuletesido) || (!szuleteshely)) {
        errors.push({ msg: 'Kérem, adja meg az adatait a jelentkezéshez!' });
    }
    
    if (errors.length > 0) {
        res.render('mentes', {
            errors,
            tanfolyamid
        });
    } else {
        Tanfolyam.findOne({_id: tanfolyamid}).populate({ path: 'kategoriaid', model: Kategoria }).exec(function (err, tanfolyam) {
            if (err) {
                console.log(err) 
                res.redirect('/');
            } else {
                const newJelentkezes = new Jelentkezes({tanfolyamid, nev, email,szuletesido,szuleteshely});
                newJelentkezes
                    .save()
                    .then(jelentkezes => {
                        req.flash(
                            'success_msg',
                            'Jelentkezés sikeres.'
                        );
                        
                        res.redirect('mentes');
                    })
                    .catch(err => console.log(err));
            } 
        });
    }
});


// Mentés visszaigazolás
router.get('/mentes', (req, res) =>
    res.render('mentes', {

    })
);





module.exports = router;
