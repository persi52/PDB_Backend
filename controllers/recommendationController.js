const express = require("express");
const fs = require('fs');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require("../controllers/verifyToken");
const {sendNotification} = require("../controllers/notificationsController.js")

const recommendMovie = async(req,res) =>{
  
    const user = req.user;
    
    if(user.user_id==req.body.receiver_id) res.status(400).send('Wrong request');

    try{
        pool.query('SELECT * FROM recommendations WHERE sender_id = $1 AND receiver_id = $2 ' +
        'AND movie_id = $3',[user.user_id,req.body.receiver_id,req.body.movie_id],(err,results)=>{
            
            if(err) throw err;

            if(results.rowCount>0) res.status(400).send('Movie was already recommended');
            else{
                pool.query('INSERT INTO recommendations (sender_id,receiver_id,movie_id)' +
                'values ($1, $2, $3)',[user.user_id, req.body.receiver_id, req.body.movie_id],(err,results)=>{ 
                           
                    if(err) throw err;
                    else sendNotification({
                        sender_id : user.user_id,
                        type : 'recommendation',
                        movie_id : req.body.movie_id,
                        receiver_id : req.body.receiver_id
                    }).then(res.status(200).send('Movie recommended successfully to user ' + user.nickname));
                    
                })
            }

    
        })
       
    }catch(err){
        res.status(403).send('Invalid statement');
        
    }
    
}

module.exports = {
    recommendMovie
}

