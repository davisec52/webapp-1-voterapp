const Poll = require("../models/poll.js");
const User = require("../models/user.js");

let middlewareObj = {};

 middlewareObj.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        console.log("Error: Must login.");
        req.flash("error", "Please login.");
        return res.redirect("/login");
    }else{
        next();
    }
};

middlewareObj.checkPollOwner = (req, res, next) => {
    if(req.isAuthenticated()){
        Poll.find({}, (err, all) => {
            if(err){
                req.flash("error", "Error");
                res.redirect("/");
            }else{
                all.forEach(item => {
                    if(item.author.id === req.user._id){
                        
                    }
                });
            }
        });
    }
};

middlewareObj.checkEmailAddress = (req, res, next) => {
	User.findOne({email: req.body.email}, function(err, foundEmail){
		if(err){
			console.log(err.mesage);
		}else{
			if(!foundEmail){
				req.flash("error", "Email not on file");
				res.redirect("back");
			}else{
				if(foundEmail){
					console.log("found the emaiil");
					next();
				}
			}
		}
	});
};

middlewareObj.isIpUnique = (req, res, next) => {
    console.log("starting middleware");
    let ip = req.headers["x-forwarded-for"];
    let temp = [];
    res.locals.ip.push(ip);
    
    Poll.findById(req.params.id, (err, poll) => {
        if(err){
            console.log(err);
        }else if(poll["voter"].length === 0){
            
            next();
            
        } else if(poll["voter"].length > 0){
        
            for(var i = 0; i < poll["voter"].length; i++){
                if(poll["voter"][i].ip === ip){
                    console.log("push to temp");
                    temp.push(ip);
                }
            }
            
            if(temp.length > 0){
                    console.log("beginning redirection back");
                    req.flash("error", "You can only vote once on any given poll.");
                    console.log("emptying temp array from ipUnique middleware");
                    temp.length = 0;
                    res.redirect("back");
                }
            
        }else{
            next();
        }
    });  // findById
    
}; //isIpUnique

module.exports = middlewareObj;