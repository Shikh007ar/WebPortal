require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findOrCreate");

mongoose.connect('mongodb://localhost:27017/reviewDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


const reviewSchema = new mongoose.Schema({
  name: String,
  review: {
    type: String,
    required: [true, "Please enter the review section in your data!"]
  }
});
const Review = new mongoose.model("Review", reviewSchema);
const item1 = new Review({
  name: "vannsh,Sharanpur",
  review: "this is the best website i found in my life"
});
const item2 = new Review({
  name: "shikhar",
  review: "Hello everyone I'm new here btw!"
});

let review = [item1, item2];




app.get("/", function(request, response){
  Review.find({}, function(err, foundReviews){
    if(foundReviews.length===0){
      Review.insertMany(review, function(err){
        if(err) console.log(err);
        else console.log("Data successfully updated!");
      });
      response.redirect("/");
    } else response.render("project", {userData: foundReviews});

  });

});

app.get("/allreviews", function(req, res){
  Review.find({}, function(err, foundReviews){
    res.render("allReviews", {userData: foundReviews});
  });
});



app.get("/addreview", function(req,res){
  res.render("addreview");
});

app.post("/", function(req, res){
  // let object = {
  //   name: req.body.userName,
  //   userWrote: req.body.reviewData
  // };
  // review.push(object);
  const addedReview = new Review({
    name: req.body.userName,
    review: req.body.reviewData
  });
  addedReview.save();
  res.redirect("/");
});
app.post("/delete", function(req, res){
  let clickedReview = req.body.button;
  Review.findByIdAndRemove(clickedReview, function(err){
    if(err) console.log(err);
    else {
      console.log("Data successfully Deleted!");
      res.redirect("/");
    }
  });
});



// Here are all things related to login and signup Page
app.get("/loginORsignup", function(req, res){
  res.render("loginORsignup");
})
const userDetail = new mongoose.Schema({
  name: String,
  lname: String,
  username: String,
  password: String,
  googleId: String
});
userDetail.plugin(passportLocalMongoose, {
  selectFields: 'username name lname'
});
userDetail.plugin(findOrCreate);

// userDetail.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const Detail = new mongoose.model("Detail", userDetail);

passport.use(Detail.createStrategy());
// passport.use('local-signup', new LocalStrategy({usernameField: "username", passwordField: "password", passReqToCallback : true },
//   function(req, username, password, done){
//     var firstname = req.body.first;
//     var lastname = req.body.last;
//   }
// ));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Detail.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/portal",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    Detail.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] })
);
app.get("/auth/google/portal",
  passport.authenticate("google", { failureRedirect: '/loginORsignup' }),
  function(req, res) {
    // Successful authentication, redirect to portal
    res.redirect("/portal");
  });

const user1 = new Detail({
  name: "Shikhar",
  lname: "Chauhan",
  email: "shikharchauhan07@gmail.com",
  password: "hello"
});
// user1.save();
app.get("/register", function(req, res){
  res.render("register");
});
app.get("/portal", function(req, res){
  if(req.isAuthenticated()) res.render("portal");
  else res.redirect("/loginORsignup");
});
app.post("/logout", function(req, res){
  req.logout();
  res.redirect("/loginORsignup");
});

 // {firstname: req.body.first, lastname: req.body.last, username: req.body.username }
app.post("/register", function(req, res){
  Detail.register( new Detail({username: req.body.username, name: req.body.first, lname: req.body.last}), req.body.password, function(err, detail){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        console.log("Registered");
        res.redirect("/portal");
      })
    }
  })
});

app.post("/login", function(req, res){
  const user = new Detail({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err) console.log(err);
    else{
      passport.authenticate("local")(req, res, function(){
        console.log("Logged In");
        res.redirect("/portal");
      });
    }
  })
});





app.listen(3000, function(){
  console.log("server is running on port 3000");
})
