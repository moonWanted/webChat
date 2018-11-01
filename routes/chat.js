var checkAuth = require('middleware/checkAuth.js');
var express = require('express');
var router = express.Router();

router.use('/', checkAuth);

router.get('/', function (req, res) {
    res.render('chat');
});

module.exports = router;