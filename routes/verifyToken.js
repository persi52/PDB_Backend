const jwt = require('jsonwebtoken'); //https://www.youtube.com/watch?v=2jqok-WgelI&t=1585s

module.exports = function(req, res, next){
    const token = req.params.token;
    if(!token) return res.status(401).send('Access Denied');

    try{
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        //console.log(verified + 'jestem weryfajd');
        next();
    }catch (err){
        res.status(400).send('Invalid Token');
    }
    return next();
}

