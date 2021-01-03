if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const { urlencoded } = require('express')
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
var mysql = require('mysql')
var nodemailer = require('nodemailer');


const initializePassport = require('./passport-config')
const { fileLoader } = require('ejs')
initializePassport(
    passport, 
    email => users.find(user => user.email === email ),
    id => users.find(user => user.id === id )
)


var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users2",
    connectionLimit: 10
})

connection.connect(function(err){
    if (err) throw err;
    console.log("Conected..")
})

const users = []
var current_user_email

var sql = "select * from test2"
connection.query(sql, function(err, result){
    if(err) throw err
    for (x of result){
        users.push({
            id: x.id,
            email: x.email,
            password: x.password
        }) 
    }
    console.log(users)
})


  
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'entityragsProject@gmail.com',
      pass: 'test1234!'
    }
  });
    
 

app.set('view-engine', 'ejs')
app.use(express.urlencoded ({extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/images'));

app.get('/', checkAuth, (req, res) => {
    res.render('index.ejs', {name: req.user.email})
    current_user_email = req.user.email
})


app.post('/sendmail', checkAuth, (req,res) => {
    console.log(current_user_email)
    var mailOptions = {
        from: 'entityragsProject@gmail.com',
        to: current_user_email,
        subject: 'Comanda EntityRags',
        text: 'Multumim pentru comanda!'
      };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
})

app.get('/login', checkNotAuth, (req,res) => {
    res.render('login.ejs')

})

app.post('/login', checkNotAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuth, (req,res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuth, async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.psw, 10)
               
        var sql = "insert into test2 values(null, '"+ req.body.email + "','"+ hashedPassword + "')"
        connection.query(sql, function(err){
            if(err) throw err

        })

        users.push({
            id: Date.now().toString(),
            email: req.body.email,
            password: hashedPassword
        })
        
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }   
    res.redirect('/login')
}

function checkNotAuth(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}


app.listen(3000)