const express = require('express');
const _ = require('lodash');
const {Attendance} = require('../../models/Attendance');
const {authenticate,authorizeMarkAttendance} = require('../middleware/middleware');
const {Workforce} = require('../../models/Workforce');
const multer  = require('multer');
let upload = multer();
const router = express.Router();
const moment = require('moment-timezone');
moment().tz("Asia/Kolkata").format();

router.post('/', upload.array(), authenticate, authorizeMarkAttendance, (req, res) => {
	let body = _.pick(req.body,['location']);

	req.attendance.location = body.location;

	req.attendance.save().then((result) => {
		res.status(200).send({
				status : 200,
				meta : {
					message : result
				}
			});
	}).catch((e) => {
		res.status(400).send({
			status : 400,
			meta : {
				message : e
			}
		});
	});
});

router.get('/list', authenticate, (req, res) => {
	if(req.employee.access_level >= 3 && req.query.workforce && req.query.date) {
		let date = moment.unix(req.query.date/1000,'milliseconds').format('YYYY-MM-DD');
		Workforce.findOne({
			'_id' : req.query.workforce
		}).then((workforce) => {
			Attendance.findAttendanceByWft(workforce,date).
			then((result) => {
				res.status(200).send({
					status : 200,
					meta : {
						message : result
					}
				});
			});

		}).catch((e) => {
			res.status(400).send({
				status : 400,
					meta : {
						message : e
					}
			});
		});
	}
	else if(req.employee.access_level == 4 && req.query.date) {
		let date = moment.unix(req.query.date/1000,'milliseconds').format('YYYY-MM-DD');
		Attendance.find({
			'date' : date
		}).then((attendances) => {
			if(attendances) {
				res.status(200).send({
					status : 200,
					date : req.query.date,
					meta : {
						message : attendances
					}
				});
			}
			else {
				let e = new Error();
				e.msg = 'No attendance records of the day';
				throw e;
			}
		}).catch((e) => {
			res.status(400).send({
				status : 400,
					meta : {
						message : e.msg
					}
			});
		});
	}
	else if(req.query.month && req.query.employee) {
		let from = moment.unix(req.query.month/1000,'milliseconds').format('YYYY-MM-DD');
		let to  = moment(from);
		to.set('month',to.get('month')+1);
		Attendance.find({
			'employee' : req.query.employee,
			'date' : {
				$gte : from,
				$lte : to
			}
		}).then((attendances) => {
			if(attendances) {
				res.status(200).send({
					status : 200,
					employee : req.query.employee,
					meta : {
						message : attendances
					}
				});
			}
			else {
				let e = new Error();
				e.msg = 'No attendance record found';
				throw e;
			}
		}).catch((e) => {
			res.status(400).send({
				status : 400,
				meta : {
					message : e.msg
				}
			});
		})
	}
	else {
		res.status(400).send({
			status : 400,
				meta : {
					message : "Unauthorized Access"
				}
		});
	}
});

router.put('/:aid', authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		Attendance.findOne({
			'_id' : req.params.aid
		})
		.then((attendance) => {
			if(attendance) {
				let body = _.pick(req.body,['date','employee','status','remark','location']);
				attendance.set(body);
				attendance.save()
				.then((result) => {
					res.status(200).send({
						status : 200,
						meta : {
							message : attendance
						}
					});
				});
			}
			else {
				let e = new Error();
				e.msg = 'No attendance with id found';
				throw e;
			}
		})
		.catch((e) => {
			res.status(400).send({
				status : 400,
				meta : {
					message : e.msg
				}
			});
		});
	}
	else {
		res.status(401).send({
			status : 401,
				meta : {
					message : "Unauthorized Access"
				}
		});
	}
});




module.exports = router;