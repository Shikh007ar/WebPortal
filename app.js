require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

mongoose.connect('mongodb://localhost:27017/reviewDB', {useNewUrlParser: true, useUnifiedTopology: true});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


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
  email: String,
  password: String
});

userDetail.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const Detail = new mongoose.model("Detail", userDetail);
const user1 = new Detail({
  name: "Shikhar",
  lname: "Chauhan",
  email: "shikharchauhan07@gmail.com",
  password: "hello"
});
// user1.save();
app.post("/login", function(req, res){
  let username= req.body.username;
  let password = req.body.password;
  Detail.findOne({email: username}, function(err, foundUser){
    if(err) console.log(err);
    else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("portal");
        }else console.log("password not matching!");
      }else console.log("You are currently not registered.");
    }
  })
});

app.get("/register", function(req, res){
  res.render("register");
});
app.post("/register", function(req, res){
  const addUser = new Detail({
    name: req.body.first,
    lname: req.body.last,
    email: req.body.username,
    password: req.body.password
  });
  addUser.save();
  res.render("loginORsignup");
});



app.listen(3000, function(){
  console.log("server is running on port 3000");
})
