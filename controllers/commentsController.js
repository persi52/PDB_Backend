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

    try{
        pool.query('SELECT c.comment_id, c.parent_id, c.comment_content, u.nickname, u.user_id, u.profile_picture FROM comments c' +
        ' INNER JOIN users u ON c.author_id = u.user_id WHERE c.movie_id=$1 ORDER BY comment_id DESC',        
        [req.params.movie_id],
        (err,results)=>{

            if(results.rows.length>0)
           { res.status(200).send(results.rows);
            res.end();}
            else return res.status(200).send('No comments')
           // console.log(results);
        })
    }catch(err){
        console.log(err); 
        return res.status(500).send('Internal error');
    } 
}

module.exports = {
    addComment,
    getComments
}