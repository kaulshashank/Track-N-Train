const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

var ClientSchema = new mongoose.Schema({
	password : {
		type : String,
		min : 8,
		required: true,
		trim : true
	},
	email :	{
		type : String,
		trim : true,
		required : true,
		unique : true,
		validate : {
			validator : (value) => {
				return validator.isEmail(value);
			},
			message : "{VALUE} is not a valid email format"
		}
	},
	company : {
		min : 3,
		max : 50,
		type : String,
		trim : true,
		required : true
	},
	tokens : [{
		access : {
			type : String,
			required : true
		},
		token : {
			type : String,
			required : true
		}
	}]
});


ClientSchema.methods.generateAuthToken = function() {
	var client = this;
	var access = 'auth';
	var token = jwt.sign({
		_id : client._id.toHexString(),
		access
	},'tophawks').toString();

	client.tokens.push({
		access,
		token
	});

	return client.save().then(() => {
		return token;
	});
}

ClientSchema.methods.toJSON = function() {
	var client = this;
	var clientObj = client.toObject();


	return _.pick(clientObj,['_id','email','company']);
}

ClientSchema.pre('save', function (next) {
	var client = this;
	if(client.isModified('password')) {
		var password = client.password;
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, result) => {
				if(!err) {
					client.password = result;
					next();
				}
			});
		});
	}
	else {
		next();
	}
});

ClientSchema.statics.findByToken = function(token) {
	var Client = this;
	var decoded;

	try {
		decoded = jwt.verify(token,'tophawks');
	} catch(e) {
		return Promise.reject();
	}

	return Client.findOne({
		'_id' : decoded._id,
		'tokens.token' : token,
		'tokens.access' : 'auth'
	});
};


var Client = mongoose.model('Client',ClientSchema);

module.exports = {
	Client
}