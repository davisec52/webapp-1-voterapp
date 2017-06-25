const express = require("express");
const expressSession = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const async = require("async");
const sendgrid = require("sendgrid");
const nodemailer = require("nodemailer");
const User = require("./app/models/user");
const flash = require("connect-flash");
const app = express();
const indexRoutes = require("./app/routes/index");

mongoose.Promise = global.Promise;
//mongoose.connect("mongodb://localhost/voterapp_v2");
mongoose.connect(process.env.DB_URI);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine", "ejs");

app.use(expressSession({
	secret: "proud pitbulls peripatetically proper",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Changes in order to allow password reset using reset tokens
//passport.use(new LocalStrategy(User.authenticate()));
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    });
  });
}));

/* -------------BEGIN ALTERNATE SERIALIZE/DESERIALIZE------------------------------- */

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

/* -------------END ALTERNATE SERIALIZE/DESERIALIZE-------------------------------- */

app.use(function(req, res, next){
	res.locals.ip = [];
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});

app.use("/", indexRoutes);


app.listen(process.env.PORT, process.env.IP, () => {
    console.log("Voterapp server listening...");
});