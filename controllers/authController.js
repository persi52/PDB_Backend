const bcrypt = require('bcrypt'); // hashowanie haseł
const pool = require('../models/db');  //database   
const Joi = require('joi'); 
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');


const signUp = async(req,res) =>{
   
    const schema = Joi.object({
        nickname: Joi.string().min(6).required(),
        email: Joi.string().min(6).email().required(),
        password: Joi.string().min(8).required(),
        repeatPassword: Joi.any().valid(Joi.ref('password')).required()
    });

    const validation = schema.validate(req.body);    //sprawdzenie walidacji 
    if(validation.error){
        res.status(400).send(validation.error.details[0].message);
        return;
    }   

    try{  

    const hashedPassword =  await bcrypt.hash(req.body.password, 10); //hashowanie hasła       
   

    pool.query(
        'SELECT * FROM users' + 
        ' WHERE email = $1', [req.body.email],
        (err, results) => {
            if(err){
                throw err;
            }        

            if(results.rows.length >0){
                res.status(422).send('Email is already registered');
               //render Email is already registered
            }else{                    
                pool.query(
                    'INSERT INTO users (nickname,email,password)' +
                     'VALUES ($1, $2, $3)' +
                     'RETURNING user_id, password', [req.body.nickname, req.body.email, hashedPassword],  
                    (err, results) => {
                        if(err){
                            throw err;                        
                    } 
                    else{
                        res.status(200).send('Signup succesfull');
                    }
                })             
            }
      }
    )   
    }catch(err){
        console.log(req.email,req.password)
        res.status(500).send()
   }  
   
};

const signIn = async (req,res) =>{
    
    try{

    pool.query('SELECT * FROM users' + 
    ' WHERE email = $1', [req.body.email],
    (err, results) => {
        if(err){
            throw err;
        }            

        if(results.rows.length > 0){   

              
            bcrypt.compare(req.body.password,results.rows[0].password).then((result)=>{ //porownanie zahashowanego hasla
            if(result){
                //console.log(results.rows[0].user_id) 
                const token = jwt.sign({
                    user_id : results.rows[0].user_id,
                }, process.env.TOKEN_SECRET);

       
                res.cookie('token', token, {
                    secure: true, // set to true if your using https
                    httpOnly: true,
                    sameSite: 'lax'
                  }).send(token);
                res.end();
                //res.send('Login success');
                // do stuff
            } else {
                res.status(401).send('Wrong email or password');
                // do other stuff
            }
            })
            .catch((err)=>console.error(err))  
            
            
        }
         else{ 
            res.status(401).send("Wrong email or password");
         }         
   
        })
    }catch(err){
         console.log(err)
         res.status(500).send()
     } 
   
   

};

const getUsersToSearch = async (req,res) =>{
    const user_id = req.user.user_id
    try{
        pool.query('SELECT * FROM users WHERE user_id<>$1',[user_id],(err,results)=>{        
            if(err) throw err;
            else res.status(200).send(results.rows);
            //console.log(results);
        })
    }catch(err){
        console.log(err);
    }
   
}

const getUsers = async (req,res) =>{
   
    try{
        pool.query('SELECT * FROM users',(err,results)=>{        
            if(err) throw err;
            else res.status(200).send(results.rows);
            //console.log(results);
        })
    }catch(err){
        console.log(err);
    }
   
}

const getUserById = async(req,res) =>{

    try{
        pool.query('SELECT * FROM users WHERE user_id=$1',[req.params.id],(err,results)=>{

            res.status(200).send(results.rows);
        })
    }catch(err){
        console.log(err);
    }
};

const getCurrentUser = async(req,res) => {
    const currentUser = req.user;

    if(!currentUser) res.status(400).send('User is not logged in'); 

    try{
        pool.query('SELECT * FROM users WHERE user_id=$1',[currentUser.user_id],(err,results)=>{

            res.status(200).send(results.rows[0]);
           // console.log(results);
        })
    }catch(err){
        console.log(err);
        return res.status(500).send('Database err'); 
    }
};

const signOut = async(req,res) =>{
    res.clearCookie("token");
    res.status(200).send('User signed out successfully');
}

const changePassword = async(req,res) => {
    const user_id = req.user.user_id;
    const body = req.body;

    const schema = Joi.object({     
        currentPassword : Joi.required(),
        newPassword: Joi.string().min(8).required(),
        repeatNewPassword: Joi.any().valid(Joi.ref('newPassword')).required()
    });

    const validation = schema.validate(body);    //sprawdzenie walidacji 
    if(validation.error){
        res.status(400).send(validation.error.details[0].message);
        return;
    }   

    try
    {

    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    
    pool.query('SELECT * FROM users' + 
    ' WHERE user_id = $1', [user_id],
    (err, results) => {
        if(err){
            throw err;
        }            
        
        if(results.rows.length > 0){   
            console.log(results.rows[0])
            bcrypt.compare(body.currentPassword,results.rows[0].password).then((result)=>{ //porownanie zahashowanego hasla
                if(result){
                           
                                  
                        pool.query('UPDATE users' + 
                        ' SET password=$1 WHERE user_id=$2', [hashedPassword, user_id],
                        (err, results) => {
                            if(err)
                            throw err;
                            else res.status(200).send('Password changed succesfully')
                        })
                }
                else res.status(401).send('Wrong current password');
            })            
          
        } else res.status(404).send('User not found')
               
            
    })}catch(err){
        console.log(err)
        res.status(500).send('Oops, something went wrong');
    }

}

const changeNickname = async(req,res) => {
    const user_id = req.user.user_id;
    const body = req.body;

    const schema = Joi.object({     
        newNickname : Joi.string().min(3).max(12).required()       
    });

    const validation = schema.validate(body);    //sprawdzenie walidacji 
    if(validation.error){
        res.status(400).send(validation.error.details[0].message);
        return;
    } 
    
    try{
        pool.query('SELECT * FROM users WHERE user_id=$1',[user_id],(err,results)=>{        
            if(err) throw err;

            if(results.rowCount>0){

                pool.query('UPDATE users SET nickname=$1 WHERE user_id=$2',[body.newNickname,user_id],
                (err,results)=>{        
                        if(err) throw err;
                        else res.status(200).send('Nickname changed succesfully');
                        //console.log(results);
                    })
                }            
            else res.status(404).send('User not found');
            //console.log(results);
        })
    }catch(err){
        console.log(err);
    }
   
    
}

const changeProfilePic = async(req,res) =>{
    const user_id = req.user.user_id;
    const body = req.body;

    const schema = Joi.object({     
        newProfilePicture : Joi.string().required()       
    });

    const validation = schema.validate(body);    //sprawdzenie walidacji 
    if(validation.error){
        res.status(400).send(validation.error.details[0].message);
        return;
    } 
    
    try{
        pool.query('SELECT * FROM photos WHERE photo_path=$1',[body.newProfilePicture],(err,results)=>{        
            if(err) throw err;

            if(results.rowCount>0){

                pool.query('UPDATE users SET profile_picture=$1 WHERE user_id=$2',[body.newProfilePicture,user_id],
                (err,results)=>{        
                        if(err) throw err;
                        else res.status(200).send('Profile picture changed succesfully');
                        //console.log(results);
                    })
                }            
            else res.status(404).send('Picture not found');
            //console.log(results);
        })
    }catch(err){
        console.log(err);
    }
}

module.exports = {
    signUp,
    signIn,
    getCurrentUser,
    getUsers,
    getUsersToSearch,
    getUserById,
    signOut,
    changePassword,
    changeNickname,
    changeProfilePic
};