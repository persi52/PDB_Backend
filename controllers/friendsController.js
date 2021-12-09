const { log } = require("console");
const express = require("express");
const fs = require('fs');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require("./verifyToken");
const {sendNotification,removeNotificationFunction} = require("../controllers/notificationsController.js")

const sendFriendRequest = async(req,res) =>{

    const user_id = req.user.user_id;
    const receiver_id = req.body.receiver_id;

    if(receiver_id == user_id)
        res.status(400).send('Wrong request'); 

        try{
            pool.query('SELECT * FROM friends WHERE (friend_one_id=$1 AND friend_two_id=$2) OR (friend_one_id=$2 AND friend_two_id=$1)',
            [user_id,receiver_id],(err,results)=>{
                
               console.log(results.rowCount + '  ' + results.rows.length)
            if(err) throw err;

            if(results.rowCount>0) res.status(400).send('Invitation was already sent!');
            else
                pool.query('INSERT INTO friends (friend_one_id,friend_two_id, is_accepted) ' +
                'values ($1, $2, false)',[user_id,receiver_id],(err,results)=>{ 
    
                    if(err) throw err;
                    
                    else sendNotification({
                        sender_id : user_id,
                        type : 'friendRequest',
                        movie_id : null,
                        receiver_id : receiver_id
                    }).then((data) => {
                        if(data)
                        res.status(200).send('Invitation sent succesfully')
                        else res.status(500).send('Oops, something went wrong')
                    });                
                })
        })
        }catch(err){
            res.status(403).send('Invalid statement');
    
        }
}

const acceptFriendRequest = async(req,res) =>{
      const user = req.user;
      const body = req.body;
    
    if(req.body.sender_id == user.user_id)
        res.status(400).send('Wrong request'); 
    
    try{
        pool.query('SELECT * FROM friends WHERE (friend_one_id=$1 AND friend_two_id=$2)',
        [body.sender_id,user.user_id],(err,results)=>{
           
        if(results.rowCount==0) res.status(400).send('Invitation does not exist!');
        else
            pool.query('UPDATE friends SET is_accepted=true ' +
            'WHERE friend_one_id=$1 AND friend_two_id=$2',[body.sender_id,user.user_id],(err,results)=>{ 

                if(err) throw err;
                else {
                    removeNotificationFunction(body).then(data => {
                        if(data) res.status(200).send('Invitation accepted');
                        else res.status(500).send('Oops, something went wrong')   
                    });
                              
                }
            })
    })
    }catch(err){
        res.status(403).send('Invalid statement');

    }

}

const declineFriendRequest = async(req,res) =>{
    const user = req.user;
    const body = req.body;

    if(req.body.sender_id == user.user_id)
        res.status(400).send('Wrong request'); 

        try{
            pool.query('SELECT * FROM friends WHERE (friend_two_id=$1 AND friend_one_id=$2)',
            [user.user_id,req.body.sender_id],(err,results)=>{
               
            if(err) throw err;
            
            if(results.rows.length>0) 
                pool.query('DELETE FROM friends WHERE (friend_two_id=$1 AND friend_one_id=$2)',
                [user.user_id,req.body.sender_id],(err,results)=>{
                    
                    if(err) throw err;
                    
                    removeNotificationFunction(body).then(data => {
                        if(data) res.status(200).send('Invitation declined');
                        else res.status(500).send('Oops, something went wrong')   
                    });
            })
            else res.status(400).send('No invitation to decline');
              
        })
        }catch(err){
            res.status(403).send('Invalid statement');
    
        }
}

const removeFriend = async(req,res) =>{
    const user = req.user;
    if(user.user_id==req.body.receiver_id)
        res.status(400).send('Wrong request');

    try{
        pool.query('DELETE FROM friends ' +
        'WHERE (friend_one_id=$1 AND friend_two_id=$2) ' + 
        'OR (friend_one_id=$2 AND friend_two_id=$1)',[user.user_id,req.body.receiver_id],
        (err,results)=>{
        
           res.status(200).send('User deleted from friends succesfully');
    
        })
    }catch(err){
        console.log(err);
    }
}
const getFriendStatus = async(req,res) =>{

    const user = req.user;

    if(req.body.receiver_id == user.user_id)
        res.status(400).send('Wrong request');   

    try{
        pool.query('SELECT * FROM friends WHERE (friend_one_id=$1 AND friend_two_id=$2) OR (friend_one_id=$2 AND friend_two_id=$1)',
        [user.user_id,req.body.receiver_id],(err,results)=>{
            if(results.rowCount==0) res.status(200).send('notFriend');
            else {
                pool.query('SELECT * FROM friends WHERE (friend_one_id=$1 AND friend_two_id=$2) ' +
                'AND is_accepted=false',
                [user.user_id,req.body.receiver_id],(err,results)=>{
                    
                    if(results.rowCount>0) res.status(200).send('invitationSent')
                    else{
                        pool.query('SELECT * FROM friends WHERE (friend_one_id=$2 AND friend_two_id=$1) ' +
                        'AND is_accepted=false',
                        [user.user_id,req.body.receiver_id],(err,results)=>{
                            
                            if(results.rowCount>0) res.status(200).send('invitationWaiting')
                            else res.status(200).send('friend');                     

                        }) 

                    }
                        
                })              
            } 
               
                
        })
    }catch(err){
        res.status(403).send('Invalid statement');
    }
}

 const getUserFriends = async(req,res) =>{

   const user = req.user;
    try{
        pool.query('SELECT DISTINCT u.nickname,u.user_id,u.profile_picture FROM users u INNER JOIN friends f ' + 
        'ON (u.user_id = f.friend_one_id OR u.user_id = f.friend_two_id) ' +
        'WHERE ((f.friend_one_id=$1 OR f.friend_two_id=$1) AND u.user_id <> $1 AND f.is_accepted=true)',[user.user_id],
//         SELECT DISTINCT u.nickname,u.user_id 
//          FROM users u 
//          INNER JOIN friends f ON (u.user_id=f.friend_two_id OR u.user_id = f.friend_one_id)
//         WHERE (f.friend_one_id=7 OR f.friend_two_id=7) AND u.user_id<>7
        (err,results)=>{
           
                if(results.rows.length>0)
                res.status(200).send(results.rows);
                else res.status(200).send('You got no friends');
            
        })
    }catch(err){
        console.log(err);
    }

 }
 

module.exports = {
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getUserFriends,
    sendFriendRequest,
    getFriendStatus
}