const express = require('express');
const _ = require('lodash');
var router = express.Router();
var {authenticate} = require('../middleware/middleware');
var {authorizeWorkforceInfo} = require('../middleware/middleware');
var {Workforce} = require('../../models/Workforce');
var multer  = require('multer');
var upload = multer();

router.post('/', upload.array(), authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		var body = _.pick(req.body,['name','leader']);

		var workforce = new Workforce(body);

		workforce.save()
		.then(() => {
			res.status(200).send({
				status : 200,
				meta : {
					message : workforce
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
		res.status(401).send({
			status : 401,
				meta : {
					message : "Unauthorized Access"
				}
		});
	}
});

router.get('/list', authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		Workforce.find()
		.then((workforces) => {
			if(workforces) {
				res.status(200).send({
					status : 200,
					meta : {
						message : workforces
					}
				});
			}
			else {
				res.status(400).send({
					status : 400,
					meta : {
						message : 'No workforces found'
					}
				});	
			}
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
		res.status(401).send({
			status : 401,
			meta : {
				message : 'Unauthorized Access'
			}
		});
	}
});

router.put('/:wid', upload.array(), authenticate, authorizeWorkforceInfo, (req, res) => {
	let body = _.pick(req.body,['name','leader']);

	req.workforce.set(body);
	req.workforce
	.save()
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
				message : e.msg
			}
		});
	});
});


router.get('/:wid', authenticate, authorizeWorkforceInfo, (req, res) => {
	res.status(200).send({
		status : 200,
			meta : {
			message : {
				workforce : req.workforce,
			}
		}
	});
});



module.exports = router;