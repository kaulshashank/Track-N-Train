var mongoose = require("mongoose");
var _ = require('lodash');
var {Employee} = require('./Employee');


//var passportLocalMongoose = require("passport-local-mongoose");

var WFTSchema = new mongoose.Schema({
	name: {
		type : String,
		minlength : 3,
		maxlength : 50,
		trim : true,
		required : true
	},
	leader : {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee'
	},
	members : [{
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee'
	}],
	projects: [{
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Project'
	}]
});

WFTSchema.statics.toJSON = function() {
	var wft = this;
	var wftObj = wft.toObject();

	return _.pick(wftObj, ['_id','name','leader','projects','members']);
}


WFTSchema.methods.getMembersInfo = function() {
	var workforce = this;

	return Employee.find({
		_id : {
			$in : workforce.members
		}
	});
}

WFTSchema.pre('save', function(next) {
	let workforce = this;
	if(workforce.isModified('leader')) {
		Employee.findOne({
			'_id' : workforce.leader
		}).then((leader) => {
			if(leader) {
				workforce.members = leader.subordinates;
				next();
			}
			else {
				let e = new Error();
				e.msg = 'No leader with leader id found'
				throw e;
			}
		}).catch((e) => {
			next(e.msg)
		});
	}
	else {
		next();
	}
});

//WFSchema.plugin(passportLocalMongoose);
var Workforce = mongoose.model("Workforce", WFTSchema);

module.exports = {
	Workforce
}
