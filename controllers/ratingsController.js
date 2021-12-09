const express = require("express");
const fs = require('fs');
const router = express.Router();
const pool = require('../models/db');
const verifyToken = require("./verifyToken");

const addRate = async(req,res) =>{

   // console.log(req.user.user_id)//res.send(req.param['set-cookie']);
  const user = req.user;

    try{
        pool.query('SELECT * FROM ratings WHERE user_id=$1 AND movie_id=$2',[user.user_id,req.body.movie_id],(err,results)=>{

            if(results.rows.length==0){
            pool.query('INSERT INTO ratings (user_id,rate,movie_id)' +
            'values ($1, $2, $3)',[user.user_id, req.body.rate, req.body.movie_id],(err,results)=>{ 

                if(err) throw err;
                else res.status(200).send('Rate has been succesfully added to movie ' + req.body.movie_id);              
                //console.log(results);
            })
            }else{
                pool.query('UPDATE ratings SET rate=$1' +
                'WHERE user_id=$2 AND movie_id=$3',[req.body.rate, user.user_id, req.body.movie_id],(err,results)=>{ 

                    if(err) throw err;
                    else res.status(200).send('Rate has been succesfully updated to movie ' + req.body.movie_id);              
                    //console.log(results);
                })
            }
        }
        )
    }catch(err){
        res.status(403).send('Invalid statement');        
    }
    
}

const getBokiem = async(req,res) =>{
    
    try{
    pool.query('SELECT SUM(rate) FROM ratings WHERE movie_id=1',
    (err,results)=>{

       console.log(results.rows[0].sum);
        
    })
}catch(err){
    console.log(err);
}   
}

const getRatesByMovieId = async(req,res) =>{

    let ratesAmount, averageRate; 
 
    try{
            pool.query('SELECT COUNT(*) FROM ratings WHERE movie_id=$1',[req.params.movie_id],
                (err,results)=>{
            if(err) throw err;           

            
            if(results.rows[0].count>0)            
             {
                ratesAmount = results.rows[0].count;
                pool.query('SELECT SUM(rate) FROM ratings WHERE movie_id=$1',[req.params.movie_id],
                (err,results)=>{
                    
                    if(err) throw err;  
                    
                    else{
                        
                        averageRate = Math.round(((  results.rows[0].sum/ratesAmount) + Number.EPSILON) * 100) / 100;
                        res.status(200).send({
                            averageRate,
                            ratesAmount
                        })                    
                    }
                
                }) 
            }
            else return res.status(200).send('No rates');           
            
        })
    }catch(err){
        console.log(err);
    }     
 }

 const getUserRate = async(req,res) =>{

    const user = req.user;

    try{
        pool.query('SELECT rate FROM ratings WHERE movie_id=$1 AND user_id=$2',[req.body.movie_id,user.user_id],
        (err,results)=>{
            //console.log(results.rows)
            if(err) throw err;
            
           if(results.rows.length>0){
           //console.log(results.rows[0]); 
           res.status(200).send(results.rows[0]);}
           else res.status(200).send('Movie is not rated yet');
            
        })
    }catch(err){
        console.log(err);
    }   
 }
 

module.exports = {
    addRate,
    getRatesByMovieId,
    getUserRate,
    getBokiem
}