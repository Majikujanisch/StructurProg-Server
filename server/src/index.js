const express = require('express')
require('dotenv').config()
const cors = require("cors");
const db = require("../config/db")
//const logger = require('../tools/logging'); Not needet due to morgan

const cookieParser = require("cookie-parser");
var path = require('path')
const app = express()
const uuidv4 = require("uuid").v4
const Cookies = require("js-cookie")
var session
const empty = []
var morgan = require('morgan')
const fs = require("fs");
const sessions = require('express-session');
const { response } = require('express');
const standartSha = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
/*if client has authentication issues:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pw';
flush privileges;

in sql
*/

//App.uses
const port = 5000
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
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
morgan.token('custom', function (req, res) { return null })
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":custom"', { stream: accessLogStream }))

app.get('/', (req, res) => {
  morgan.token('custom', function (req, res) { return "connect to /" })
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
    console.log(req)
    if(username == '' || email == '' || pw == standartSha){
      NotEmpty = false
      morgan.token('custom', function (req, res) { return "Fail, empty response" })
      res.send("Empty body (or field) received")
    }
    else {
      NotEmpty = true;
    }
    if(NotEmpty){
    db.query("select * from user where username=? OR email=?", [username, email], (err, result) =>{
      //Error occurs if no user with this username is found, so this user is not in the system and should be 
      //added
      if(err || result.length === 0){
        db.query("insert into user (username, pw, email) values (?,?,?)", [username, pw, email], (err, result)=>{
          if(err){
              console.log((err))
          }
          morgan.token('custom', function (req, res) { return "Success, user registered" })
          res.send('added to users')
          
      })
      }
      else {
        morgan.token('custom', function (req, res) { return "Fail, Username or Email already used" })
        res.send("Username or Email already in system")
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
  morgan.token('custom', function (req, res) { return "login" })
  let email = req.body.user
  let pw = req.body.pw
  if(email && pw){
    db.query('SELECT * FROM user WHERE email = ? AND pw = ?', [email, pw], (err, result)=> {
      if(err) {
        console.log(err)
      }
      console.log(typeof(result))
      console.log("Result")
      if(result[0]){
        if(Object.hasOwn(result[0], "username")){   
        session = req.session
				cookie = req.cookies
        //var sessiontok = uuidv4
        res.cookie("userid", result[0].idUser,{maxAge:9000000})
        res.cookie("usermail", req.body.user,{maxAge:9000000})
        res.cookie("SessionToken", req.sessionID,{maxAge:9000000})
        var Userid = result[0].idUser
         db.query('INSERT INTO sessions VALUES (?,?,?)',[Userid, session.cookie._expires ,req.sessionID], (err, result)=>{
           if(err){
             //console.log(err)       Duplicate entry
             if(err.errno = 1062){
             db.query('UPDATE sessions SET data=? WHERE session_id=?', [req.sessionID, Userid], (error, result)=>{
              if(error){
                console.log(err)
              }
              if(result){
                console.log("reautheniticated")
                morgan.token('custom', function (req, res) { return "reautheniticated" })
                res.send("reauth")
              }
             }
             )}
           }
           else{
             console.log("wrote "+ req.sessionID + " into db of user "+ email)
             morgan.token('custom', function (req, res) { return "logged in, authentication token set" })
            res.send("logged in")
           }
         })
      }
      
    }
    else {
      morgan.token('custom', function (req, res) { return "failed login, email or pw" })
      res.send("incorrect email or password")
    }
    });
  }
  else{
  res.send("no inputs")
  }
})

app.get('/api/logout', function(request, response) {
	// If the user is loggedin
	if (request.cookies.SessionToken) {
    var sessionid = request.cookies.SessionToken
    var user = request.cookies.userid
		// delete session out of DB
    db.query('DELETE FROM sessions WHERE (session_id = ?)',[user], (err, result)=>{
      if(err){
        console.log(err)
      }
      else{
        req.session.destroy();
        console.log("deleted "+ sessionid + " from db of user "+ user)
        morgan.token('custom', function (req, res) { return "logout, DB: -session.session_id" })
        response.send("logged out")
        //clearout cookies
        Cookies.remove('*',{ path: '' })
      }
    })
    
	} 
});

// test for session management
app.get('/secret',(req,res)=>{
  session = req.session
  cookie = req.cookies
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
        morgan.token('custom', function (req, res) { return "autheniticated" })
        console.log("authenticated")
        res.sendStatus(200)
      }
      else{
        console.log("something went wrong with authenticating, result but tokenmissmatch")
        morgan.token('custom', function (req, res) { return "Failed, secret Tokenmissmatch" })
        res.sendStatus(600)
      }
    }
    else{
      console.log("something went wrong with authenticating, empty result")
      morgan.token('custom', function (req, res) { return "Failed, secret empty result" })
      res.send("empty result")
    }
  })
});

console.log("API Started")