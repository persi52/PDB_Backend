const jwt = require('jsonwebtoken'); //https://www.youtube.com/watch?v=2jqok-WgelI&t=1585s

module.exports = function(req, res, next){
    const token = req.cookies.token;
    if(!token) return res.status(401).send('Access Denied');

    try{
        const user = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = user;
        next();
    }catch (err){
        res.status(403).send('Invalid Token');
    }
}

