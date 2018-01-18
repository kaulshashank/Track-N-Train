const express = require('express');
const path = require('path');
let router = express.Router();
const _ = require('lodash');
const {Report} = require('../../models/Report');
let {authorizeReportAddition,authenticate} = require('../middleware/middleware');
let multer  = require('multer');
let upload = multer();
const moment = require('moment-timezone');
moment().tz("Asia/Kolkata").format();


router.post('/', upload.array(), authenticate, authorizeReportAddition, (req, res) => {
	let body = _.pick(req.body,['title','entity','location','employee','fields']);
	let report = new Report();
	report.title = body.title;
	report.entity = body.entity;
	report.employee = body.employee;
	report.location = body.location;
	report.fields = JSON.parse(body.fields);
	let today = moment.tz(new Date(), 'Asia/Kolkata');
	report.date = today.format('YYYY-MM-DD');
	

	report.save()
	.then((result) => {
		res.status(200).send({
				status : 200,
				meta : {
					message : result
				}
			});
	})
	.catch((e) => {
		res.status(400).send({
				status : 400,
				meta : {
					message : e
				}
			});
	});
});

router.get('/list', authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		Report.find()
		.then((reports) => {
			if(reports) {
				res.status(200)
				.send({
					status : 200,
					meta : {
						message : reports
					}
				});
			}
			else {
				let e = new Error();
				e.msg = 'No reports found';
				throw e;
			}
		}).catch((e) => {
			res.status(400)
				.send({
					status : 400,
					meta : {
						message : e.msg
					}
				});
		});
	}
	else {
		Report.find({
			$or : [{
				'employee' : {
					$in : req.employee.subordinates
				}
			},{
				'employee' : req.employee._id
			}]
		}).then((reports) => {
			if(reports) {
				res.status(200)
				.send({
					status : 200,
					meta : {
						message : reports
					}
				});
			}
			else {
				let e = new Error();
				e.msg = 'No reports found';
				throw e;
			}
		}).catch((e) => {
			res.status(400)
				.send({
					status : 400,
					meta : {
						message : e.msg
					}
				});
		})
	}
});


router.put('/:rid', upload.array(), authenticate, authorizeReportAddition, (req, res) => {
	let body = _.pick(req.body,['title','entity','location','employee','fields']);
	Report.findOne({
		'_id' : req.params.rid
	}).then((report) => {
		if(report) {
			report.title = body.title;
			report.entity = body.entity;
			report.employee = body.employee;
			report.location = body.location;
			report.fields = JSON.parse(body.fields);
			report.save()
			.then((result) => {
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
		}
		else {
			let e = new Error();
			e.msg = 'No report with id found';
			throw e;
		}
	}).catch((e) => {
		res.status(400).send({
				status : 400,
				meta : {
					message : e
				}
			});
	});
});



module.exports = router;
