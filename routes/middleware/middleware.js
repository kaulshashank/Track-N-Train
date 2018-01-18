let {Employee} = require('../../models/Employee');
let {Client} = require('../../models/Client');
let{Project} = require('../../models/Project');
let{Workforce} = require('../../models/Workforce');
let {Task} = require('../../models/Task');
let{Attendance} = require('../../models/Attendance');

const _ = require('lodash');
const moment = require('moment-timezone');
moment().tz("Asia/Kolkata").format();

let authenticate = (req, res, next) => {
	let token = req.header('x-auth');

	Employee.findByToken(token).then((employee) => {
		if(!employee) {
			return Promise.reject();
		}
		
		req.employee = employee;
		req.token = token;
		next();

	}).catch((e) => {
		res.status(401).send({
			status : 401,
			meta : {
				message : 'Unauthorized Access'
			}
		});
	});
};

let authenticateClient = (req, res, next) => {
	let token = req.header('x-auth');

	Client.findByToken(token).then((client) => {
		if(!client) {
			return Promise.reject();
		}
		
		req.client = client;
		req.token = token;
		next();

	}).catch((e) => {
		res.status(401).send({
			status : 401,
			meta : {
				message : 'Unauthorized Access'
			}
		});
	});
};

let authorizeEmployeeEdit = (req, res, next) => {
	if(req.employee.access_level == 4) {
		next();
	}
	else {
		if(employee._id === req.params.eid) {
			next();
		}
		else {
			res.status(401).send({
				status: 401,
				meta : {
					message : 'Unauthorized access'
				}
			});
		}
	}
}
let authorizeTaskAddition = (req, res, next) => {
	let project = req.body.project;
	if(project == null) {
		res.status(400).send({
			status: 400,
			meta : {
				message : 'Invalid data supplied in the request'
			}
		});
	}
	Project.findOne({
		'_id' : project
	}).then((project) => {
		if(project) {
			let employee = _.find(project.members,req.employee.id);
			if(employee && employee.access_level > 0 || req.employee.access_level > 1) {
				req.project = project;
				next();
			}
			else {
				res.status(401).send({
					status: 401,
					meta : {
						message : 'Unauthorized Access'
						}
				});
			}
		}
		else {
			res.status(400).send({
				status: 400,
				meta : {
					message : 'No project with id found'
				}
			});
		}
	}).catch((e) => {
		res.status(400).send({
			status: 400,
			meta : {
				message : e
			}
		});
	});
}

let authorizeWorkforceInfo = (req, res, next) => {
		Workforce.findOne({
			'_id' : req.params.wid,
		}).then((workforce) => {
			if(workforce) {
				let found = _.find(workforce.members,req.employee._id);
				if(req.employee.access_level > 1 || found) {
					req.workforce = workforce;
					next();
				}
				else {
					res.status(401).send({
						status: 401,
						meta : {
							message : 'Unauthorized Access'
						}
					});
				}
			}
			else {
				let error = new Error();
				error.msg = 'No workforce with the id exists';
				throw error;
			}
		}).catch((e) => {
			res.status(400).send({
				status: 400,
					meta : {
					message : e.msg
				}
				});
		});
};

let authorizeProjectInfo = (req, res, next) => {
	Project.findOne({
		'_id' : req.params.pid 
	}).then((project) => {
		if(project != null) {
			Workforce.findOne({
				'_id' : project.workforce
			}).then((workforce) => {
				if(workforce != null) {
					let found = _.find(workforce.members,req.employee._id);
					if(found || req.employee.access_level > 1) {
						req.project = project;
						next();
					}
					else {
						res.status(401).send({
							status: 401,
							meta : {
								message : 'Unauthorized Access'
							}
						});
					}
				}
				else {
					
					let error = new Error();
					error.msg = 'The workforce allocated to project is invalid';
					throw error;
				}
			});
		}
		else {
			let error = new Error();
			error.msg = 'No project with id exists';
			throw error;
		}
	}).catch((e) => {
		res.status(400).send({
			status: 400,
			meta : {
				message : e
			}
		});
	});
};

let authorizeMarkAttendance = (req, res, next) => {
	let today = moment.tz(new Date(), 'Asia/Kolkata');
		let attendance = new Attendance();
		if(today.get('hour') < 9 || (today.get('hour') == 9 
			&& today.get('minute') < 5)) {
			attendance.status = 'Present';
		}
		else if(today.get('hour') < 13 || (today.get('hour') == 13 
			&& today.get('minute') < 0)) {
			attendance.status = 'Half Day';
		}
		else {
			attendance.status = 'Absent';
		}

		attendance.employee = req.employee._id;
		attendance.date = today.format('YYYY-MM-DD');
		attendance.remark = `The employee marked attendance at ${today.get('hour')}:${today.get('minute')}`;


		Attendance.findOne({
			'employee' : attendance.employee,
			'date' : attendance.date
		}).then((found) => {
			if(!found) {
				req.attendance = attendance;
				next();
			}
			else {
				var e = new Error()
				e.msg = 'Attendance is already marked';
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

let authorizeReportAddition = (req, res, next) => {
	try {
		let body = _.pick(req.body, ['rtype','name','description','entity',
			'date','location','employee']);

		if(req.employee.access_level == 4) {
			next();
		}

		else if(req.employee.access_level == 0 &&
		 req.employee._id == body.employee) {
			Task.findOne({
				'_id' : body.entity,
					'employee' : req.employee._id,
			}).then((task) => {
				if(task) {
						next();
				}
				else {	
					let e = new Error();
					e.msg = 'No task with id found';
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

		else if(req.employee.access_level == 1 &&
			req.employee._id == body.employee) {
			Project.findOne({
				'_id' : body.entity
			}).then((project) => {
				if(project) {
					Workforce.findOne({
						'_id' : project.workforce,
						'leader' : req.employee._id
					}).then((workforce) => {
						if(workforce) {
							next();
						}
						else {
							let e = new Error();
							e.msg = 'No workforce related to entity found';
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
				else {
					let e = new Error();
					e.msg = 'No project with id found';
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
			})
		}
		else if(req.employee.access_level > 1 &&
		 req.employee._id == body.employee) {
			next();
		}
		else {
			res.status(401).send({
				status : 401,
				meta : {
					message : 'Unauthorized access'
				}
			});
		}
	}
	catch(e) {
		res.status(400).send({
				status : 400,
				meta : {
					message : e.msg
				}
			});
	}
}
let isLoggedIn = (req, res, next) => {

	let user  = req.cookies.user;

	if(!(user === undefined)) {
		next();
	}
	else {
		res.redirect('/login');
	}
};

module.exports = {
	authenticate,
	authenticateClient,
	isLoggedIn,
	authorizeEmployeeEdit,
	authorizeTaskAddition,
	authorizeWorkforceInfo,
	authorizeProjectInfo,
	authorizeMarkAttendance,
	authorizeReportAddition
};