const express = require("express");
const fs = require('fs');
const router = express.Router();
const pool = require('../models/db');



const stream_video = async(req,res) =>{
   // console.log(req.params.id)
    let movie;
    try{
         await pool.query(
            'SELECT * FROM movies' + 
            ' WHERE movie_id = $1', [req.params.id],
            (err, results) => {
                if(err){
                    throw err;
                }  
                    
          movie = results.rows[0];          
          //console.log(movie);
  
    
    const range = req.headers.range;//
    //console.log(req.headers.range);
    const videoPath = movie.url;
    const videoSize = fs.statSync(videoPath).size;

    if(!range) {
        const headers = {
            "Content-Length": 1,
            "Content-Type": "video/mp4",
        };
        res.writeHead(206, headers);
       
        const stream = fs.createReadStream(videoPath);
        stream.pipe(res);

    }else{
    

    const chunkSize = 1 * 1e+6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize -1);

    const contentLength = end - start + 1;

    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
   
    const stream = fs.createReadStream(videoPath, { start, end });
    stream.pipe(res);}
})
    }catch(err){
        console.log(err);
    }

}

module.exports = {
    stream_video    
};