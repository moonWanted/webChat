var User = require('models/user.js').User;
var AuthError = require('models/user.js').AuthError;
var createError = require('http-errors');

/*exports.get = function(req, res) {
    res.render('login');
};*/

var express = require('express');

var router = express.Router();

router.get('/', function (req, res) {
    res.render('login');
});

router.post('/', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    User.authorize(username, password)
        .then(user=>{
        req.session.user = user._id;
        res.send({});

    })
        .catch(err =>{

            if(err instanceof AuthError){
                console.log('err');
                return next(createError(403,'Error'));
            }else {

                return next(err);
            }
        });
});

module.exports = router;