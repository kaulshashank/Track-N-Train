let mongoose = require('mongoose');
let {Task} = require('./Task');
const _ = require('lodash');



let ReportSchema = mongoose.Schema({
	title : {
		type : String,
		required : true,
		maxlength : 50,
		minlengthg : 5
	},
	employee : {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee',
		required : true
	},
	entity : {
		type : mongoose.Schema.Types.ObjectId
	},
	date : {
		type : Date
	},
	location : {
		type : String,
		minlength : 10,
		required : true
	},
	fields : [{
		field_name : {
			type : String,
			required : true
		},
		field_value : {
			type : String,
			required : true
		}
	}]
});

ReportSchema.methods.toJSON = function() {
	var employee = this;
	var employeeObj = employee.toObject();

	return _.pick(employeeObj,['_id','title','location','employee',
		'entity','date','fields']);
};




let Report = mongoose.model('Report',ReportSchema);

module.exports = {
	Report
}