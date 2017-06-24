const express = require("express");
const router = express.Router();
const passport = require("passport");
const async = require("async");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Poll = require("../models/poll");
const User = require("../models/user");
const Config = require("../config/config.json")
const middleware = require("../controllers/middleware.js");

//Authentication routes
router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.get("/reset", (req, res) => {
    res.render("reset");
});


router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Successfully logged out");
    console.log("Successfully logged out");
    res.redirect("/");
});

/*
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/",
		failureRedirect: "/login"
	}), function(req, res){
	    req.flash("success", "Login successful");
	    console.log("Login complete.");
	    
});
*/

/* ------------------------------------------------------ */

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      req.flash("error", "Sorry, you don't appear to exist as a user.");
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash("success", "Successfully logged in!");
      return res.redirect("/");
    });
  })(req, res, next);
});

/* ------------------------------------------------------------*/


/*
router.post("/register", (req, res) => {
	var newUser = new User({username: req.body.username, email: req.body.email});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			//req.flash("error", err.message);  //this also works with line below.
			//return res.redirect("/register"); //must return  res.redirect when using req.flash()
			return res.render("register", {"error": err.message}); //render requires inclusion of object
		}
		passport.authenticate("local")(req, res, function(){
		    req.flash("success", "Successfully registered!");
		    console.log("Successfully registered");
			res.redirect("/login");
		});
	});
});
*/

/* --BEGIN MODIFIED REGISTER----ALLOWS LOGIN ON REGISTER AND USE OF STRONG PW--------- */

router.post('/register', function(req, res) {
  var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
	if(!req.body.password.match(strongRegex) || !req.body.password || !req.body.email){
		req.flash("error", "Password snafu. Password must have at least: 8 characters, 1 lowercase letter, 1 uppercase character, 1 number, and 1 special character. Be sure to include valid email.");
		res.redirect("/register");
	}else{
  
  var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });

  user.save(function(err) {
    if(err){
      req.flash("error", err.message);
    }
    req.logIn(user, function(err) {
      if(err){
        req.flash("error", "Error. Failed to automatically log in.");
      }
      res.redirect("/");
    });
  });
	}
});

/* -------END MODIFIED REGISTER---BEGIN PASSWORD RESET BELOW---------------------------------------------------------------- */

/* ---------------------BEGIN PASSWORD RESET SECTION------------------------ */
//Tutorial from: http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
//SHOW : route for forgot password page
router.get("/forgot", function(req, res){
	res.render("forgot");
});

//Added middleware to Post route to prevent app from terminating connection if there is no email address on file
router.post("/forgot", middleware.checkEmailAddress, (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
  //This call to database may be out of place. May need to occur in post callback function    
      User.findOne({ email: req.body.email }, function(err, user) {
        if(err){
          console.log("error: " + err.message);
        }else{
        
        console.log("Found the email");
        
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
        }
      });
    },
      
      function(token, user, done){
        
  /* -------------BEGIN SENDGRID API------------------------------ */
        
       /* var helper = require('sendgrid').mail,
    
        from_email = new helper.Email("testLocal@example.com"),
        to_email = new helper.Email(user.email),
        subject = "Node.js Password Reset",
        content = new helper.Content("text/plain", 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'),
        mail = new helper.Mail(from_email, subject, to_email, content);
        
    //Requires exporting sendgrid api key to locally set env variable to work in cloud9 environment. 
    // process.env.SENDGRID_API_KEY (for use when uploading to heroku)
        var sg = require('sendgrid')(process.env.EXTERNAL_API_KEY);
        var request = sg.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON()
        });
        
        sg.API(request, function(error, response) {
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
        }); */
        
    /* ------------BEGIN NODEMAILER OAUTH2---code from https://github.com/nodemailer/nodemailer/blob/master/examples/oauth2.js
    ---help from https://stackoverflow.com/questions/24098461/nodemailer-gmail-what-exactly-is-a-refresh-token-and-how-do-i-get-one-------
    -----help from ------------------------ */
        
                // Create a SMTP transporter object
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                type: 'OAuth2',
                user: 'altrecov@gmail.com',
                clientId: '394645389947-9tmmuts0vupqh6e1sk2qkm26fbql634v.apps.googleusercontent.com',
                clientId: Config.ClientId,
               // clientSecret: 'P4Rw9wgMIfl8nM3FtQEeroPs',
                clientSecret: Config.ClientSecret,
               // refreshToken: '1/1iw5MOrp7MiogdnOY-LgoCIT3MztyTvGlder11fMnfI',
                refreshToken: Config.RefreshToken,
               // accessToken: 'ya29.GltyBN6d4jhFQEOO0PrXpVR1tKR9tnaCuEX5xfT91IK-jOSCX_vGWPfJihr3ysUOSmDnS2oh_DHvO052LVQrMx7soEsWJwXfaiR_ryvQ80tLWPMtGGBOtm2jydWp',
                accessToken: Config.AccessToken,
                expires: 360000
            },
           // logger,
            debug: true // include SMTP traffic in the logs
        }, {
            // default message fields
        
            // sender info
            from: 'Password Reset <altrecov@gmail.com>',
            headers: {
                'X-Laziness-level': 1000 // just an example header, no need to use this
            }
        });
        
        console.log('SMTP Configured');
        
        // Message object
        let message = {
        
            // Comma separated list of recipients
            to: user.email,
        
            // Subject of the message
            subject: 'password recovery test', //
        
            // plaintext body
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n',
        
        
            // HTML body
          //  html: '<p><b>Hello</b> to myself <img src="cid:note@example.com"/></p>' +
                //'<p>Here\'s a nyan cat for you as an embedded attachment:<br/><img src="cid:nyan@example.com"/></p>',
        
            
        };
        
        console.log('Sending Mail');
        transporter.sendMail(message, (error, info) => {
            if (error) {
                console.log('Error occurred');
                console.log(error.message);
                return;
            }
            req.flash("success", "Password reset email sent successfully.")
            console.log('Message sent successfully!');
            console.log('Server responded with "%s"', info.response);
            transporter.close();
        });
        
    /* ------------------------END NODEMAILER OAUTH2 TRIAL--------------------------- */    
        
      }],
        function(err){
          if(err){
            next(err);
          } 
        }
    ); 
    req.flash("success", "Message sent to address on file. Check your inbox. May also be necessary to check spam folder.");
    res.redirect("/forgot");
  });
  
  router.get("/reset/:token", function(req, res){
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
      if(err){
        console.log(err.message);
      }else if(!user){
        req.flash("error", "Reset token is invalid or has expired. Request password reset again.");
        res.redirect("/forgot");
      }else{
        res.render("reset", {user: user});
      }
    });
  });
  
  router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        console.log("found user from reset: " + user);
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      
  /* ------------------SENDGRID---------------------------------------- */    
      
     /* var helper = require('sendgrid').mail,
    
        from_email = new helper.Email("testLocal@example.com"),
        to_email = new helper.Email(user.email),
        subject = "Your password has been changed.",
        content = new helper.Content("text/plain", 'Hello,\n\n' +
          'This is a confirmation that the password for your Vote Cruncher app account using the email address ' + user.email + ' has just been changed.\n'),
        mail = new helper.Mail(from_email, subject, to_email, content);
        
    //Requires exporting sendgrid api key to locally set env variable to work in cloud9 environment. 
    // process.env.SENDGRID_API_KEY (for use when uploading to heroku)
        var sg = require('sendgrid')(process.env.EXTERNAL_API_KEY);
        var request = sg.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON()
        });
        
        sg.API(request, function(error, response) {
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
        }); */
        
    /* ---------------Begin 2nd instance of-Nodemailer ----------------------------------------- */
        
                // Create a SMTP transporter object
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                type: 'OAuth2',
                user: 'altrecov@gmail.com',
                clientId: '394645389947-9tmmuts0vupqh6e1sk2qkm26fbql634v.apps.googleusercontent.com',
                clientSecret: 'P4Rw9wgMIfl8nM3FtQEeroPs',
                refreshToken: '1/1iw5MOrp7MiogdnOY-LgoCIT3MztyTvGlder11fMnfI',
                accessToken: 'ya29.GltyBN6d4jhFQEOO0PrXpVR1tKR9tnaCuEX5xfT91IK-jOSCX_vGWPfJihr3ysUOSmDnS2oh_DHvO052LVQrMx7soEsWJwXfaiR_ryvQ80tLWPMtGGBOtm2jydWp',
                expires: 360000
            },
           // logger,
            debug: true // include SMTP traffic in the logs
        }, {
            // default message fields
        
            // sender info
            from: 'Password Reset <altrecov@gmail.com>',
            headers: {
                'X-Laziness-level': 1000 // just an example header, no need to use this
            }
        });
        
        console.log('SMTP Configured');
        
        // Message object
        let message = {
        
            // Comma separated list of recipients
            to: user.email,
        
            // Subject of the message
            subject: 'password recovery test', //
        
            // plaintext body
            text: 'This is a confirmation that the password for your Vote Cruncher app account using the email address ' + user.email + ' has just been changed.\n',
        
        
            // HTML body
          //  html: '<p><b>Hello</b> to myself <img src="cid:note@example.com"/></p>' +
                //'<p>Here\'s a nyan cat for you as an embedded attachment:<br/><img src="cid:nyan@example.com"/></p>',
        
            
        };
        
        console.log('Sending Mail');
        transporter.sendMail(message, (error, info) => {
            if (error) {
                console.log('Error occurred');
                console.log(error.message);
                return;
            }
            req.flash("success", "Password reset email sent successfully.")
            console.log('Message sent successfully!');
            console.log('Server responded with "%s"', info.response);
            transporter.close();
        });
    }
  ], function(err) {
      if(err){
        console.log(err.message);
      }
  });
  req.flash("success", "Log in using your new password.");
  res.redirect('/login');
});

/* ----------- END PASSWORD RESET SECTION ---------------------------------------------------- */



//GET route for twitterpop login message
router.get("/mustlogin/:id", (req, res, next) => {
    req.flash("error", "Must login to share.");
    res.redirect("/showpoll/" + req.params.id)
});

//Reset post route
router.post("/reset", (req, res, next) => {
    User.findByUsername(req.body.username, (err, name) => {
        if(err){
            console.log(err);
        }else{
            if(name){
                name.setPassword(req.body.password);
                console.log("Password reset");
                res.redirect("/login");
            }
        }
    });
});

//Poll GET routes
router.get("/", (req, res, next) => {
    Poll.find({}, (err, allPolls) => {
        if(err){
            console.log(err);
        }else{
            res.render("index", {allPolls: allPolls});
        }
    });
});

router.get("/new", middleware.isLoggedIn, (req, res, next) => {
    res.render("createpoll");
});

//Show GET route for specific poll
router.get("/showpoll/:id", (req, res, next) => {
    let twitterContent = "New poll on FCC voter app at: " + req.headers["host"] + "/showpoll/" + req.params.id;
    Poll.findById(req.params.id, (err, poll) => {
        let labels = [];
        let data = [];
        if(err){
            console.log(err);
        }else{
            poll["options"].forEach(opt => {
                if(opt && opt.count !== undefined){
                    labels.push(opt.value);
                    data.push(opt.count);
                }
            });
            console.log("testing labels from show: ", labels);
            console.log("testing data from show: ", data);
            res.render("showpoll", {poll: poll, user: req.user, twitterMsg: twitterContent, labels: labels, data: data });
        }
    });
});

//GET route for polls grouped by user
router.get("/userpolls/:id", middleware.isLoggedIn, (req, res, next) => {
    Poll.find({}, (err, allPolls) => {
        let userCol = [];
        if(err){
            console.log(err);
        }else{
            allPolls.forEach(item => {
                if(item.author.id.equals(req.params.id)){
                    userCol.push(item);
                }
            });
            res.render("userpolls", {allPolls: userCol, user: req.user});
        }
    });
});

//DESTROY route for user's polls
router.delete("/showpoll/:id", (req, res, next) => {
    Poll.findByIdAndRemove(req.params.id, (err) => {
        if(err){
            req.flash("error", "Error: unable to delete.");
            console.log(err);
            res.redirect("/");
        }else{
            req.flash("success", "Poll deleted.");
            res.redirect("/");
        }
    });
});

//POST route for new poll
router.post("/post", middleware.isLoggedIn, (req, res, next) => {
    User.findById(req.user._id, (err, user) => {
        if(err){
            console.log(err);
            res.redirect("/");
        }else{
            let title = req.body.formtitle;
            let opts = req.body.formoptions;
            opts = opts.replace(/\r\n/gi, ",");
            opts = opts.split(",");
            let optsArr = [];
            
            let options = {
                value: "",
                count: 0
            }
            
            opts.forEach(item => {
                options = {
                    value: item,
                    count: 0
                };
                optsArr.push(options);
            });
            
            let author = {
                id: req.user._id,
                username: req.user.username
            };
            
            let voter = [];
            
            optsArr.push({value: "Custom option, please!"});
            optsArr.unshift({value: "Make Your Choice Below:"});
            
            let newPollObj = {
                title: title,
                options: optsArr,
                author: author,
                voter: voter
            };
            
            Poll.create(newPollObj, (err, poll) => {
                if(err){
                    console.log(err);
                }else{
                    user.col.push(poll.title);
                    user.polls.push({"title": poll.title, "id": poll._id});
                    user.save();
                    req.flash("success", "Success! New poll added!");
                    return res.redirect("/showpoll/" + poll._id);
                }
            });
        }
    });
});

//POST route for custom poll option
router.post("/custom/:id", middleware.isLoggedIn, middleware.isIpUnique, (req, res, next) => {
    let customOpt = {value: req.body.customOpt, count: 0};
    
    Poll.findById(req.params.id, (err, poll) =>{
        if(err){
            console.log(err);
        }else{
            poll.options.splice(poll.options.length-1, 0, customOpt);
            poll.save();
            console.log(poll);
            res.redirect("/showpoll/" + poll._id);
        }
    });
});

//POST route for voter results
router.post("/voteresult/:id", middleware.isIpUnique, (req, res, next) => {
    //res.locals.ip.push(req.headers["x-forwarded-for"]);
    let userIp = res.locals.ip[0];
    
    Poll.findById(req.params.id, (err, poll) => {
        if(err){
            console.log(err);
        }else{
            if(!req.user){
                poll["voter"].push({"ip": userIp});
                res.locals.ip.length = 0;
            }else{ 
                poll["voter"].push({"username": req.user.username, "ip": userIp});
                res.locals.ip.length = 0;
            }
            
            poll["options"].forEach(item => {
                if(item.value === req.body.select){
                    item.count += 1;
                    poll.save();
                    console.log(poll);
                    res.redirect("/showpoll/" + poll._id);
                }
            });
            //Empty userIp array to prevent duplicaton of ip options
            userIp.length = 0;
        }
    });
});

module.exports = router;