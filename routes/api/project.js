const express = require('express');
const _ = require('lodash');
var {Project} = require('../../models/Project');
var {Workforce} = require('../../models/Workforce');
var {authenticate} = require('../middleware/middleware');
var {authorizeProjectInfo} = require('../middleware/middleware');
var router = express.Router();
var multer  = require('multer');
var upload = multer();

router.post('/', upload.array(), authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		var body = _.pick(req.body,['name','description',
			'client','workforce']);

		var project = new Project(body);

		project.save(req.employee).then(() => {
			res.status(200).send({
			status : 200,
				meta : {
					message : project
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
	var employee = req.employee;

	if(employee.access_level == 4) {
		Project.find().
		then((projects) => {
			if(projects) {
				res.status(200).send({
					status : 200,
						meta : {
							message : projects
						}
				});
			}
			else {
				new Error('No projects found');
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


router.put('/:pid',upload.array(), authenticate, authorizeProjectInfo, (req, res) => {
	let body = _.pick(req.body,['name','description',
		'client','workforce']);
	let oldworkforce = req.project.workforce;
	console.log(oldworkforce);
	req.project.set(body);
	req.project.save(oldworkforce)
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
				message : e.msg
			}
		});
	});
					
});


router.get('/:pid', authenticate, authorizeProjectInfo, (req, res) => {
	res.status(200).send({
		status : 200,
			meta : {
				message : req.project				
			}			
		});

});

router.get('/', authenticate, (req, res) => {
	if(req.query.wid != null) {
		var employee = req.employee;

		Workforce.findOne({
			'_id' : req.query.wid,
			'members' : employee._id
		}).then((workforce) => {
			Project.find({
				'workforce' : workforce._id
			}).then((projects) => {
				res.status(200).send({
					status : 200,
							meta : {
							message : projects
						}
				});
			});
		}).catch((e) => {
			res.status(401).send({
				status : 401,
					meta : {
						message : "Unauthorized Access"
					}
			});
		});
	}
	else {
		res.status(400).send({
				status : 400,
					meta : {
						message : "Invalid Request"
					}
			});
	}

});

module.exports = router;