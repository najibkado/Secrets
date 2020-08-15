//jshint esversion:6
require("dotenv").config();
const express = require("express");
const parser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
const port = 3000;
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(parser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "thisisourlittlesecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretsDB", {useUnifiedTopology: true, useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({"secret":{$ne:null}}, function (err, foundUsers) {
   if (err) {
       console.log(err);
       
   } else {
       if (foundUsers) {
        res.render("secrets", {foundUsersWithSecter: foundUsers});
       }
   }
  });
});

app.post("/login", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    });

});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post('/submit', function(req, res){
    const submitedSecret= req.body.secret;

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);     
        } else {
            if (foundUser) {
                foundUser.secret = submitedSecret;
                foundUser.save(function () {
                   res.redirect("/secrets") 
                });
            }
        }
    });
}); 

app.post("/register", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    app.post('/signup', function(req, res, next){
        passport.authenticate('local', function(err, user, info) {
           //Your code here       
        })(req, res, next);
    }); 
    
    User.register({username: username}, password, function (err, user) {
        if (!err) {    
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        } else {
            console.log(err);
            res.redirect("/register");
        }
    });
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});







// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


// app.post("/login", function(req, res) {
//     const username = req.body.username;
//     const password = req.body.password;


//     User.findOne({email: username}, function (err, userFound) {
//         if (userFound) {
          
//           bcrypt.compare(password, userFound.password, function (err, result) {
//             if (result === true) {
//                 res.render("secrets");
//             } else {
//                 res.send("Password does not match!");
//             }
//           });
          
//         } else {
//             console.log(err)
//         }
//     })
// });



// app.post("/register", function(req, res) {

//     // md5(req.body.password)

//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         const user = new User({
//             email: req.body.username,
//             password: hash
//         });
    
//         user.save(function (err) {
//             if (!err) {
//                 res.render("secrets");
//             } else {
//                 res.render("error");
//             }
//         });
//     });

// });










app.listen(port, function (req, res) {
    console.log("Server runing on port 3000");
});