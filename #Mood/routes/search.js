var express = require('express');
var router = express.Router();

router.get('/search', function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
