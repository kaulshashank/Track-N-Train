const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const {Workforce} = require('./Workforce');

mongoose.Promise = global.Promise;
var EmployeeSchema = new mongoose.Schema({
	password: {
		type : String,
		minlength : 8,
		trim : true,
		required : true
	},
	fname: {
		type : String,
		minlength : 2,
		trim : true
	},
	lname: {
		type : String,
		minlength : 2,
		trim : true
	},
	contact: {
		type : String,
		minlength : 10,
		maxlength : 10,
		trim : true,
	},
	gender: {
		type : String,
		enum : ["Male","Female","Other"],
	},
	access_level: {
		type : Number, // 0 - FOS, 1 - Team Leader, 2 - APM, 3 - PM , 4 - Admin
		min : 0,
		max : 4,
		default : 0
	}, 
	img_url: {
		type : String,
		trim : true
	},
	location : {
		lat : {
			type : Number,
		},
		lng : {
			type : Number,
		}
	}, 
	perf: {
		type : Number,
		min : 0,
		max : 10,
		default : 0
	},
	email: {
		type : String,
		trim : true,
		unique : true,
		required : true,
		validate : {
			validator : (value) => {
				return validator.isEmail(value);
			},
			message : "{VALUE} is invalid email"
		},

	},
	superior : {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee'
	},
	subordinates : [{
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee'
	}],
	tokens : [{
		access : {
			type  :String,
			required : true
		},
		token : {
			type : String,
			required : true
		}
	}]
});



EmployeeSchema.methods.generateAuthToken = function() {
	var employee = this;
	var access = 'auth';
	var token = jwt.sign({
		_id : employee._id.toHexString(),
		access
	},'tophawks').toString();

	employee.tokens.push({
		access,
		token
	});
	return employee.save().then(() => {
		return token;
	});
};

EmployeeSchema.methods.toJSON = function() {
	var employee = this;
	var employeeObj = employee.toObject();

	return _.pick(employeeObj,['_id','email','access_level','fname','lname',
		'gender','contact','perf','location','superior','subordinates']);
};

EmployeeSchema.methods.removeToken = function (token) {
	var employee = this;

	return employee.update({
		$pull : {
			tokens : {
				token : token
			}
		}
	});
};

EmployeeSchema.statics.findByToken = function(token) {
	var Employee = this;
	var decoded;

	try {
		decoded = jwt.verify(token,'tophawks');
	} catch(e) {
		return Promise.reject();
	}

	return Employee.findOne({
		'_id' : decoded._id,
		'tokens.token' : token,
		'tokens.access' : 'auth'
	});
};

EmployeeSchema.statics.findByCredentials = function(email, password) {
	var Employee = this;
	return Employee.findOne({
		email
	}).then((employee) => {
		if(!employee) {
			return Promise.reject('Incorrect email or password');
		}
		else {
			return bcrypt.compare(password, employee.password).then((result) => {
				if(result) {
					return Promise.resolve(employee);
				}
				else {
					return Promise.reject('Password could not be salted');
				}
			})
		}
	}).catch((e) => {
		return Promise.reject(e);
	});

};

EmployeeSchema.pre('save', function (next) {
	let employee = this;
	if(employee.isModified('password')) {
		let password = employee.password;

		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => {
				if(!err) {
					employee.password = hash;
					if(employee.access_level == 0) {
						if(employee.superior) {
							Workforce.findOne({
								'leader' : employee.superior
							}).then((workforce) => {
								if(workforce) {
									workforce.members.push(employee._id);
									workforce.save();
									next();
								}
								else {
									next();
								}
							}).catch((e) =>{
								next(e);
							})
						}
						else {
							next();
						}
					}	
					else if(employee.access_level == 1) {
						Workforce.findOne({
							'leader' : employee._id 
						}).then((workforce) => {
							if(workforce) {
								workforce.members = employee.subordinates;
								workforce.save();
								next();
							}
							else {
								next();
							}
						}).catch((e) => {
							next(e);
						})
					}
					else {
						next();
					}
				}
			});
		});
	} else {
		next();
	}

});

var Employee = mongoose.model("Employee",EmployeeSchema);

module.exports = {
	Employee
}