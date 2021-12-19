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

const cancelFriendRequest = async(req,res) => {
    console.log(req.body)
    const user_id = req.user.user_id;
    const receiver_id = req.body.receiver_id;

    if(receiver_id == user_id)
        res.status(400).send('Wrong request'); 

        try{
            pool.query('SELECT * FROM friends WHERE (friend_two_id=$2 AND friend_one_id=$1)',
            [user_id,receiver_id],(err,results)=>{
               
            if(err) throw err;
            
            if(results.rows.length>0) 
                pool.query('DELETE FROM friends WHERE (friend_two_id=$2 AND friend_one_id=$1)',
                [user_id,receiver_id],(err,results)=>{
                    
                    if(err) throw err;
                    
                    removeNotificationFunction({
                        sender_id : user_id, 
                        receiver_id : receiver_id,
                        type : 'friendRequest'
                    }).then(data => {
                        if(data) res.status(200).send('Invitation canceled');
                        else res.status(500).send('Oops, something went wrong')   
                    });
            })
            else res.status(400).send('No invitation to cancel');
              
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
        (err,results)=>{
           
                if(results.rows.length>0)
                res.status(200).send(results.rows);
                else res.status(200).send('You got no friends');
            
        })
    }catch(err){
        console.log(err);
    }

 }

const getFriendTasteCoverage = async(req,res) => {
    const user_id = req.user.user_id;
    const friend_id = req.params.friend_id;
   
    if(friend_id===undefined || (user_id==friend_id))
    res.status(400).send('Wrong request');
 
   const userTaste = await getUserTaste(user_id)
   const friendTaste =await getUserTaste(friend_id)

   countTasteCoverage(userTaste,friendTaste).then(data => res.status(200).send({tasteCoverage : data}))
 }

//  async function getUserTaste(user_id){
//     // SELECT m.genre_id FROM public.movies m INNER JOIN public.seen_movies s ON m.movie_id=s.movie_id WHERE user_id=7;
//     //const user_id = body.user_id   
    
//     try{
//         await pool.query('SELECT DISTINCT f.movie_id FROM public.favourite_movies fm' +
//          ' INNER JOIN favourite_movies f ON fm.movie_id=f.movie_id' +
//          '  WHERE (f.user_id=$1 AND fm.user_id=$2)',[user_id,friend_id])
//          .then((data) => data.rows.forEach(element => 
//             result.push(element.movie_id)))

//         await pool.query('SELECT DISTINCT f.movie_id FROM public.seen_movies fm' +
//          ' INNER JOIN seen_movies f ON fm.movie_id=f.movie_id' +
//          '  WHERE (f.user_id=$1 AND fm.user_id=$2)',[user_id,friend_id])
//          .then((data) => data.rows.forEach(element => 
//             result.push(element.movie_id)))

//         await pool.query('SELECT DISTINCT r.movie_id FROM public.ratings rt' +
//          ' INNER JOIN ratings r ON rt.movie_id=r.movie_id' +
//          '  WHERE (r.user_id=$1 AND rt.user_id=$2) AND r.rate>3',[user_id,friend_id])
//          .then((data) => data.rows.forEach(element => 
//             result.push(element.movie_id)))
   
//     }catch(err){
//         console.log(err);
//     }
//     console.log(result);
//    return result;
//  } 

 async function getUserTaste(user_id){
     const results = [];
    try{

        await pool.query('SELECT m.genre_id FROM public.movies m' +
        ' INNER JOIN favourite_movies f ON m.movie_id=f.movie_id' +
        '  WHERE f.user_id=$1',[user_id])
        .then((data) => data.rows.forEach(element =>{
           element.genre_id.forEach(genre =>
           {     
               //if(!results.includes(genre)) 
                results.push(genre)
            }
           )
        }))

        await pool.query('SELECT m.genre_id FROM movies m' +
        ' INNER JOIN seen_movies s ON m.movie_id=s.movie_id' +
        '  WHERE s.user_id=$1',[user_id])
        .then((data) => data.rows.forEach(element =>{
            element.genre_id.forEach(genre =>
            {     
                //if(!results.includes(genre)) 
                 results.push(genre)
             }
            )
         }))

         await pool.query('SELECT m.genre_id FROM movies m' +
        ' INNER JOIN ratings r ON m.movie_id=r.movie_id' +
        '  WHERE r.user_id=$1 AND r.rate>3',[user_id])
        .then((data) => data.rows.forEach(element =>{
            element.genre_id.forEach(genre =>
            {     
                //if(!results.includes(genre)) 
                 results.push(genre)
             }
            )
         }))
         
        
    }catch(err){
        console.log(err);
    }
    //console.log(results)
    return results;
}
 async function countTasteCoverage(userTaste,friendTaste){
    let covPercent = 0;
    const userTasteFiltered = []
    const friendTasteFiltered = []

    userTaste.forEach(element =>{
        if(!userTasteFiltered.includes(element))
            userTasteFiltered.push(element)
    })

    friendTaste.forEach(element =>{
        if(!friendTasteFiltered.includes(element))
            friendTasteFiltered.push(element)
    })

    
    if(userTaste.length>friendTaste.length)
        friendTaste.forEach(element => {
            if(userTaste.some(value => element == value))
            covPercent+= (1/userTaste.length)
        })
    else 
            userTaste.forEach(element => {
            if(friendTaste.some(value => element == value))
            covPercent+= (1/friendTaste.length)
        })    

   return Math.round(covPercent*100);
 }

module.exports = {
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getUserFriends,
    sendFriendRequest,
    getFriendStatus,
    getFriendTasteCoverage,
    getUserTaste
}