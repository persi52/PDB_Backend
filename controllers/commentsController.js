const express = require("express");
const fs = require('fs');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require("./verifyToken");

const addComment = async(req,res) =>{

    const currentUser = req.user;

    try{
        pool.query('INSERT INTO comments (author_id, movie_id, comment_content)' +
        'VALUES($1,$2,$3)',
        [currentUser.user_id, req.body.movie_id, req.body.comment_content],
        (err,results)=>{

            if(err) throw err;
            else res.status(200).send('Comment was added');
           // console.log(results);
        })
    }catch(err){
        console.log(err); 
        return res.status(500).send('Internal error');
    } 

}

const getComments = async(req,res) =>{
    const user_id = req.user.user_id;
    const movie_id = req.params.movie_id;
    const comments = []
    try{
        await pool.query('SELECT c.comment_id, c.parent_id, c.comment_content, l.is_positive,u.nickname , u.user_id,u.profile_picture FROM comments c' + 
        ' LEFT JOIN comments_likes l ON c.comment_id = l.comment_id' + 
        ' INNER JOIN users u ON c.author_id = u.user_id'  +
        ' WHERE c.movie_id=$1 AND (l.giver_id=$2 OR l.giver_id IS NULL) ORDER BY c.comment_id DESC',        
        [movie_id,user_id]).then(async (data) => {

            if(data.rowCount>0){
                 await data.rows.forEach(async (element)=> {

                    element.likeAmount = await countCommentLikes({
                        comment_id : element.comment_id
                    })    
              
                              
                })

                return await res.status(200).send(data.rows)
               
        

            }else res.status(200).send('No comments')
        })
    }catch(err){
        console.log(err); 
        return res.status(500).send('Internal error');
    } 
}

async function countCommentLikes(body){
    let likeAmount = 0
   
    try{
        await pool.query('SELECT is_positive FROM comments_likes WHERE comment_id=$1',[body.comment_id])
        .then((data) => { 
            if(data.rows.length>0){
                data.rows.forEach(element => {
                    likeAmount = (element.is_positive==true) ? likeAmount+1 : likeAmount-1    
                    //console.log(likeAmount)                
                })            
            }
            else console.log('No likes');            
        })  
        return likeAmount    

    }catch(err){
        console.log(err);       
    }
    //return Promise.resolve(likeAmount)//.then(data => {return data})
}

const getUserCommentLike = async(req,res) =>{
    const currentUserId = req.user.user_id;
    try{
        pool.query('SELECT * FROM comments_likes WHERE comment_id=$1 AND giver_id=$2',[req.params.comment_id,currentUserId],
        (err,results)=>{
            if(results.rows.length>0){
                res.status(200).send(results.rows[0]);
                res.end();
            }else return res.status(200).send('No like');
        })
    }catch(err){
        console.log(err);
        return res.status(500).send('Internal error');
    }
}

const addCommentLike = async(req,res) =>{

    const user_id = req.user.user_id;
    const comment_id = req.body.comment_id;
    const is_positive = req.body.isPositive;
  
    try{
      pool.query('INSERT INTO comments_likes (is_positive,giver_id,comment_id) ' +
      'values ($1, $2, $3)',[is_positive,user_id,comment_id],
      (err,results)=>{
        
        if(err) throw err;
        else return true;      
      }
      )}catch(err){
      console.log(err);
      }
}

const deleteCommentLike = async(req,res) =>{

    const user_id = req.user.user_id;
  
    try{
      pool.query('DELETE FROM comments_likes WHERE (giver_id=$1 AND comment_id=$2)',[user_id,req.params.comment_id],
      (err,results)=>{
        
        if(err) throw err;
        else return true;      
      }
      )}catch(err){
      console.log(err);
      }
}

module.exports = {
    addComment,
    getComments,    
    addCommentLike,
    deleteCommentLike,
    getUserCommentLike,
}