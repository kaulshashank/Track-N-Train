const express = require('express');
const path = require('path');
let router = express.Router();
const _ = require('lodash');
const {ReportStructure} = require('../../models/ReportStructure');
let {authenticateClient,authenticate} = require('../middleware/middleware');
let multer  = require('multer');
let upload = multer();

router.post('/', upload.array(), authenticateClient, (req, res) => {
	let body = _.pick(req.body,['access_level','fields']);

	let reportStructure = new ReportStructure();
	reportStructure.client = req.client._id;
	reportStructure.access_level = body.access_level;
	reportStructure.fields = JSON.parse(body.fields);

	reportStructure.save()
	.then((reportStructure) => {
		res
		.status(200)
		.send({
			status : 200,
			meta : {
				message : reportStructure
			}
		});
	})
	.catch((e) => {
		res
		.status(400)
		.send({
			status : 400,
			meta : {
				message : e
			}
		});
	});
});


router.put('/:rsid', upload.array(), authenticateClient, (req, res) => {
	ReportStructure.findOne({
		'_id' : req.params.rsid
	}).then((reportStructure) => {
		if(reportStructure) {
			if(String(reportStructure.client)===String(req.client._id)) {
				let body = _.pick(req.body,['fields','access_level']);

				reportStructure.fields = JSON.parse(body.fields);
				reportStructure.access_level = body.access_level;

				reportStructure.save()
				.then((reportStructure) => {
					res
					.status(200)
					.send({
						status : 200,
						meta : {
							message : reportStructure
						}
					});
				})
				.catch((e) => {
					throw e;
				})
			}
			else {
				res
				.status(401)
				.send({
					status : 401,
					meta : {
						message : 'Unauthorized Access'
					}
				});
			}
		}
		else {
			let e = new Error();
			e.msg = 'No report structure with id found';
			throw e;
		}
	})
	.catch((e) => {
		res
		.status(400)
		.send({
			status : 400,
			meta : {
				message : e.msg
			}
		});
	})
});


router.get('/list',authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		ReportStructure.find()
		.then((reportStructures) => {
			if(reportStructures) {
				res
				.status(200)
				.send({
					status : 200,
					meta : {
						message : reportStructures
					}
				});
			}
			else {
				let e = new Error();
				e.msg = 'no report structures found';
				throw e;
			}
		})
		.catch((e) => {
			res
			.status(400)
			.send({
				status : 400,
				meta : {
					message : e.msg
				}
			});
		})
	}
	else if(req.query.client) {
		ReportStructure.find({
			'client' : req.query.client
		})
		.then((reportStructures) => {
			if(reportStructures) {
				res
				.status(200)
				.send({
					status : 200,
					meta : {
						message : reportStructures
					}
				});
			}
			else {
				let e = new Error();
				e.msg = 'no report structures found';
				throw e;
			}
		})
		.catch((e) => {
			res
			.status(400)
			.send({
				status : 400,
				meta : {
					message : e.msg
				}
			});
		});
	}
	else {
		res
		.status(400)
		.send({
			status : 400,
			meta : {
				message : 'Invalid request'
			}
		});
	}
});


module.exports = router;