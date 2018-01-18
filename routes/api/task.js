const express = require('express');
const _ = require('lodash');
var {Task} = require('../../models/Task');
var {authenticate} = require('../middleware/middleware');
var {authorizeTaskAddition} = require('../middleware/middleware');
var {Project} = require('../../models/Project');

var router = express.Router();
var multer  = require('multer');
var upload = multer();


router.post('/', upload.array(), authenticate, authorizeTaskAddition, (req, res) => {
	if(req.employee.access_level > 0) {
		var body = _.pick(req.body, ['name','description','project','employee',
			'deadline','location','status','priority']);
		var task = new Task(body);

		task.save().then((result) => {
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
		})
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

router.get('/list', authenticate, (req, res) => {
	if(req.employee.access_level > 0) {
		Task.find()
		.then((tasks) => {
			res.status(200).send({
				status : 200,
				meta : {
					message : tasks
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
				message : 'Unauthorized access'
			}
		});
	}
});


router.put('/:tid', authenticate, (req, res) => {
	if(req.params.tid) {
		Task.findOne({
			'_id' : req.params.tid
		}).then((task) => {		
			if(task) {
				Project.findOne({
					'_id' : task.project
				})
				.then((project) => {
					if(project) {
						project.isEmployeeAuthorized(req.employee)
						.then((value) => {
							if(value || req.employee.access_level == 4) {
								var body = _.pick(req.body, ['name','description','priority',
									'status','project','employee',
									'deadline','location']);
								task.set(body);
								task.save()
								.then((newTask) => {
									res.status(200).send({
										status : 200,
										meta : {
											message : newTask
										}
									});		
								}).catch((e) => {
									res.status(400).send({
										status : 400,
										meta : {
											message : ''
										}
									});
								});
							}
							else {
								res.status(401).send({
									status : 401,
									meta : {
										message : 'Unauthorized acccess'
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
						res.status(400).send({
									status : 400,
									meta : {
										message : 'Task does not belong to a valid project'
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
				})
			}
			else {
				res.status(400).send({
					status : 400,
					meta : {
						message : 'No task with id found'
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
		})
	}
	else {
		res.status(400).send({
			status : 400,
			meta : {
				message : 'No task id supplied'
			}
		});
	}
});

router.get('/:tid', authenticate, (req, res) => {
	Task.findOne({
		'_id' : req.params.tid
	}).then((task) => {
		res.status(401).send({
			status : 401,
			meta : {
				message : task
			}
		});
	}).catch((e) => {
		res.status(400).send({
			status : 400,
			meta : {
				message : e
			}
		});
	})
});


router.get('/', authenticate, (req, res) => {
	if(req.query.pid != null) {
		Project.findOne({
			'_id' : req.query.pid
		}).then((project) => {
			if(project) {
				project.isEmployeeAuthorized(req.employee)
				.then((value) => {
					if(value || req.employee.access_level == 4) {
						Task.find({
							'project' : project._id
						}).then((tasks) => {
							res.status(200).send({
								status : 200,
								meta : {
									message : tasks	
								}
							});
						});
					}
					else {
						res.status(401).send({
							status : 401,
							meta : {
								message : 'Unauthorized acccess'
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
				res.status(400).send({
					status : 400,
					meta : {
						message : 'Invalid Project Id'
					}
				});		
			}
		});
	}
	else {
		res.status(400).send({
			status : 400,
			meta : {
				message : 'Invalid Request'
			}
		});
	}
});

module.exports = router;