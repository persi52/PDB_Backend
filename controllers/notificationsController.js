const express = require("express");
const fs = require('fs');
const { isRef } = require("joi");
const router = express.Router();
const pool = require('../models/db');



const getUserNotifications = async(req,res) =>{

  const user_id = req.user.user_id;

  try{
    pool.query('SELECT * FROM notifications WHERE receiver_id=$1 ORDER BY notification_id DESC',[user_id],
    (err,results)=>{
      
        if(results.rows.length>0){   
         sortNotifications(results.rows).then(data => res.status(200).send(data));       
         
        }
        else res.status(200).send('No notifications');

       
       // console.log(results);
    })
    
    }catch(err){
    console.log(err);
    }
      
}

const removeNotification = async(req,res) =>{
  const user_id = req.user.user_id;
  const body = req.body;
  body.sender_id = user_id; 
  removeNotificationFunction(body);
}

async function sortNotifications(notifications){ 

  let sortedNotifications = [];
  
  for(const notification of notifications){

    switch(notification.type){

      case 'recommendation' : 
      await pool.query('SELECT m.title, m.thumbnail, u.nickname, u.profile_picture ' + 
      'FROM movies m, users u ' + 
      'WHERE (movie_id=$1 AND user_id=$2)',[notification.movie_id,notification.sender_id])
      .then( (data) =>{   

        return {
        notification_id : notification.notification_id,
        type : 'recommendation',
        movie_id : notification.movie_id,
        movie_title : data.rows[0].title,
        movie_thumbnail : data.rows[0].thumbnail, 
        sender_id : notification.sender_id,
        sender_nickname : data.rows[0].nickname,
        sender_profile_picture : data.rows[0].profile_picture              
      }
    })
     .then((data) => {sortedNotifications.push(data)});     
    
        break;

      case 'friendRequest' : 
      await pool.query('SELECT nickname, profile_picture FROM users WHERE user_id=$1',[notification.sender_id])
      .then( (data) => {
      return {
       notification_id : notification.notification_id,
       type : 'friendRequest',
       sender_id : notification.sender_id,
       nickname : data.rows[0].nickname,
       sender_profile_picture : data.rows[0].profile_picture                
                       
      }
    })
    .then((data) => {sortedNotifications.push(data)});

        break;
    }
    
  }
  return sortedNotifications;   
    
  
}

const sendNotification = async(body) =>{
  //console.log(body);


  try{
    pool.query('INSERT INTO notifications (type,movie_id,sender_id,receiver_id) ' +
    'values ($1, $2, $3, $4)',[body.type,body.movie_id,
      body.sender_id,body.receiver_id],
    (err,results)=>{
      
        if(err) throw err;
        else return true;
       // console.log(results);
    })
    }catch(err){
    console.log(err);
    }
}

const removeNotificationFunction = async(body) =>{
    console.log(body);
  const notification_id = body.notification_id;

  if(notification_id){
      try{
        pool.query('DELETE FROM notifications WHERE notification_id=$1',[notification_id],
          
        (err,results)=>{
          
            if(err) throw err;
            else return true;          
        })
        }catch(err){
        console.log(err);
        }
      } 
      else {
        try{
          pool.query('DELETE FROM notifications WHERE sender_id=$1 AND receiver_id=$2 AND ' + 
          'type=$3',[body.sender_id,body.receiver_id,body.type],
            
          (err,results)=>{
            
              if(err) throw err;
              else return true;            
          })
          }catch(err){
          console.log(err);
          }
      }
}



module.exports = {
    getUserNotifications,
    sendNotification,
    removeNotification,
    removeNotificationFunction
};
