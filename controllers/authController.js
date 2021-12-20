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
        ' WHERE email = $1 OR nickname = $2', [req.body.email,req.body.nickname],
        (err, results) => {
            if(err){
                throw err;
            }   

            if(results.rows.length >0){
                if(req.body.nickname == results.rows[0].nickname)
                res.status(422).send('Nickname is already registered');
                else res.status(422).send('Email is already registered');
               //render Email is already registered
            }else{                    
                pool.query(
                    'INSERT INTO users (nickname,email,password,profile_picture)' +
                     'VALUES ($1, $2, $3, $4)' +
                     'RETURNING user_id, password', [req.body.nickname, req.body.email, hashedPassword, 'avatar9.png'],  
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
                    sameSite: 'none',
                    domain : 'https://pdbmovies.netlify.app'
                }).send(token);
                //res.end();
                // res.status(200).send({
                //     status : "Ok",
                //     token : token
                // })
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


const signOut = async(req,res) =>{
    res.clearCookie("token");
    res.status(200).send('User signed out successfully');
}

module.exports = {
    signUp,
    signIn,
    signOut      
};