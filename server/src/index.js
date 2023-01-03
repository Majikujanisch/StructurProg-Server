const express = require('express')
require('dotenv').config()
const cors = require("cors");
const db = require("../config/db")
const logger = require('../tools/logging');
const { response } = require('express');
const app = express()
const standartSha = 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
/*if client has authentication issues:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pw';
flush privileges;

in sql
*/
const port = 5000
app.use(express.json())
app.use(cors({
    origin: "http://localhost:3000",
}))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
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
    db.query("select * from user where username=?", [username], (err, result) =>{
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
  console.log(email)
  if(email && pw){
    db.query('SELECT * FROM user WHERE email = ? AND pw = ?', [email, pw], (err, result)=> {
      console.log(result)
      if(err) {
        console.log(err)
      if(result.length > 0){
        req.session.loggedin = true;
				req.session.username = username;
				// Redirect to home page
				//res.redirect('/home');
        res.send("logged in")
      }
      else {
        res.send("incorrect email or password")
      }
      res.end();
    }});
  }
  res.send("no inputs")
})

app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

console.log("API Started")