const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt-nodejs");

let UserSchema = new mongoose.Schema({
    
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    polls: [
		{
			type: mongoose.Schema.Types.Mixed,
			ref: "Poll"
		}
	],
	
	col: []
});


UserSchema.pre('save', function(next) {
  let user = this;
  let SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    console.log("salt " + salt);
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      console.log("hash: " + hash);
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

/* Plugin not needed with current configuration */
//UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);