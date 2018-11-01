var express = require('express');

var router = express.Router();

router.post('/', function(req, res){
    var sid = req.session.id;

    var io = req.app.get('io');
    req.session.destroy(function (err) {
        if(io){
            io.sockets._events.sessreload(sid);
        }
        if (err) return next(err);
        res.redirect('/');
    });

});

module.exports = router;