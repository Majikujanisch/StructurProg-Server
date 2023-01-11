const express = require('express')
require('dotenv').config()
const cors = require("cors");
const db = require("../config/db")
const logger = require('../tools/logging');
const { response } = require('express');
const cookieParser = require("cookie-parser");
const app = express()
const uuidv4 = require("uuid").v4
const Cookies = require("js-cookie")
var session
const sessions = require('express-session');
const standartSha = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
/*if client has authentication issues:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pw';
flush privileges;

in sql
*/

//App.uses
const port = 5000
app.use(express.json())
app.use(sessions(
  { 
     genid: function(req) {
      return uuidv4() // use UUIDs for session IDs
    },
     name:"SessionCookie",
     secret: 'gffjgfjhgfjgfjgdsfsflkizuv',
     saveUninitialized: false,
     cookie: { maxAge: 86400000, secure: false },  //One day: 86 400 000
     resave: false 
  }));
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello World!')
})
//listen to port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//list of API point
 app.post('/api/registration', async (req, res)=>{
    const username = req.body.user
    const pw = req.body.password
    const email = req.body.email
    let NotEmpty = false
    console.log(username + " " + pw)
    if(username == '' || email == '' || pw == standartSha){
      NotEmpty = false
      logger.logApi(req, res, 'registration', '2')
    }
    else {
      NotEmpty = true;
    }
    if(NotEmpty){
    db.query("select * from user where username=? OR email=?", [username, email], (err, result) =>{
      console.log(result)
      //Error occurs if no user with this username is found, so this user is not in the system and should be 
      //added
      if(err || result.length === 0){
        db.query("insert into user (username, pw, email) values (?,?,?)", [username, pw, email], (err, result)=>{
          if(err){
              console.log((err))
          }
          logger.logApi(req, res, 'registration', '0')
          res.send('added to users')
          
      })
      }
      else {
        logger.logApi(req, res, 'registration', '1')
      }
    })
    }//Empty IF
})
//getUser/user -> dynamic API Route
app.get("/api/getUser/:user", async(req, res) => {
  let username = req.params.user
  db.query("select * from user where username=?", [username], (err, result) =>{
    resul = result[0]
    console.log(resul)
    return res.json(resul)
  })
})

app.post("/api/login", async(req, res) => {
  console.log("login")
  let email = req.body.user
  let pw = req.body.pw
  if(email && pw){
    db.query('SELECT * FROM user WHERE email = ? AND pw = ?', [email, pw], (err, result)=> {
      if(err) {
        console.log(err)
      }
      if(result != undefined && result != null && result != "[]"){
        if(Object.hasOwn(result[0], "username")){   
        session = req.session
				cookie = req.cookies
        //var sessiontok = uuidv4
        res.cookie("userid", result[0].idUser,{maxAge:9000000})
        res.cookie("usermail", req.body.user,{maxAge:9000000})
        res.cookie("SessionToken", req.sessionID,{maxAge:9000000})
        
         db.query('INSERT INTO sessions VALUES (?,?,?)',[result[0].idUser, session.cookie._expires ,req.sessionID], (err, result)=>{
           if(err){
             console.log(err)
           }
           else{
             console.log("wrote "+ req.sessionID + " into db of user "+ email)
           }
         })
        res.send("<h1>logged in</h1>")
      }
      
    }
    else {
      res.status(404).send("incorrect email or password")
    }
      res.end();
    });
  }
  else{
  res.send("no inputs")
  }
})

app.get('/logout', function(request, response) {
	// If the user is loggedin
	if (request.cookies.SessionToken) {
    var sessionid = request.cookies.SessionToken
    var user = request.cookies.userid
		// delete session out of DB
    db.query('DELETE FROM `sessions` WHERE (session_id = ?)',[user], (err, result)=>{
      if(err){
        console.log(err)
      }
      else{
        console.log("deleted "+ sessionid + " into db of user "+ user)
      }
    })
    //clearout cookies
    Cookies.remove('*',{ path: '' })
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

// test for session management
app.get('/secret',(req,res)=>{
  session = req.session
  cookie = req.cookies
  var authenicated = false
  //console.log("Cookie")
  //console.log(cookie.SessionCookie)
  db.query('SELECT sessions.data FROM sessions INNER JOIN user on sessions.session_id=user.idUser WHERE user.email = ?',[cookie.usermail], (err, result)=>{
    if(err){
      console.log(err)
    }
    else if(result[0]){
      console.log(result[0].data)
      console.log(cookie.SessionToken)
      if(result[0].data == cookie.SessionToken){

        authenicated = true
        console.log("authenticated")
        res.sendStatus(200)
      }
      else{
        console.log("something went wrong with authenticating, result but tokenmissmatch")
        res.sendStatus(600)
      }
    }
    else{
      console.log("something went wrong with authenticating, empty result")
    }
  })
});

console.log("API Started")