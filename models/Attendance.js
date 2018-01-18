const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
moment().tz("Asia/Kolkata").format();

let AttendanceSchema = new mongoose.Schema({
	date : {
		type : Date,
		required : true
	},
	employee : {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee',
		required : true,
	},
	status : {
		type : String,
		enum : ['Present','Absent','Half Day'],
		required : true
	},
	remark : {
		type : String,
		maxlength : 200
	},
	location : {
		type : String,
		required : true,
		minlength : 10
	}
});

AttendanceSchema.statics.findAttendanceByWft = function(workforceTeam,date) {
	let Attendance = this;

	return Attendance.find({
		'employee' : {
			$in : workforceTeam.members
		},
		'date' : date
	});
}

let Attendance = mongoose.model('Attendance',AttendanceSchema);


module.exports = {
	Attendance
}