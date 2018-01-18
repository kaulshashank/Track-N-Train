const express = require('express');
const path = require('path');
let router = express.Router();
const _ = require('lodash');
let {Employee} = require(path.join('../../','models','Employee'));
let {Workforce} = require(path.join('../../','models','Workforce'));

let {authenticate} = require('../middleware/middleware');
let {authorizeEmployeeEdit} = require('../middleware/middleware');
let bcrypt = require('bcryptjs');
let multer  = require('multer');
let upload = multer();


router.post('/', upload.array(), authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		let body = _.pick(req.body,['password','email','access_level','fname','lname',
			'contact','gender','superior','perf','subordinates']);
		let employee = new Employee();

		employee.fname = body.fname;
		employee.lname = body.lname;
		employee.contact = body.contact;
		employee.gender = body.gender;
		employee.email = body.email;
		employee.perf = body.perf;
		employee.password = body.password;
		employee.access_level = body.access_level;
		if(body.superior) {
			employee.superior = body.superior;
		}
		if(body.subordinates) {
			employee.subordinates = JSON.parse(body.subordinates);
		}

		employee.save().
		then((employee) => {
			Employee.findOne({
				'_id' : employee.superior
			}).then((superior) => {
				superior.subordinates.push(employee._id);
				superior.save();
			});
			res.status(200).send({
					status : 200,
					meta : {
						message : employee
					}
				});
		})
		.catch((e) => {
			if(e.code === 11000) {
				res.status(422).send({
					status : 422,
						meta : {
						message : 'Email already exists'
					}
				});
				}
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


router.post('/register', upload.array(), (req, res) => {
	let body = _.pick(req.body,['password','email']);

	let employee = new Employee(body);

	if(employee.email == 'admin@admin.com' 
			&& employee.password == 'admin1234') {
			employee.access_level = 4;
	}

	employee.save().then((success) => {
		return employee.generateAuthToken();
	}).then((token) =>{
		res.header('x-auth', token).status(200).send({
				status : 200,
				meta : {
					message : employee
				}
			});
	}).catch((e) => {
		if(e.code === 11000) {
			res.status(422).send({
				status : 422,
				meta : {
					message : 'Email already exists'
				}
			});
		}
		res.status(400).send({
				status : 400,
				meta : {
					message : e
				}
			});
	});
});

router.get('/me' , authenticate,  (req, res) => {
	res.status(200).send({
		status : 200,
		meta : {
			message : req.employee
		}
	});
});

router.put('/', upload.array(), authenticate, (req, res) => {
	Employee.findOne({
		'_id' : req.employee._id
	}).then((employee) => {
		let body = _.pick(req.body,['fname','lname',
			'contact','gender']);
		employee.fname = body.fname;
		employee.lname = body.lname;
		employee.contact = body.contact;
		employee.gender = body.gender;
		employee.save().then((result)=>{
			res.status(200).send({
				status : 200,
				meta : {
					message : result
				}
			});
		})
	}).catch((e) => {
		res.status(400).send({
			status : 400,
			meta : {
				message : e
			}
		});
	})
});

router.put('/:eid', upload.array(), authenticate, (req, res) => {
	Employee.findOne({
		'_id' : req.params.eid
	}).then((employee) => {
		let oldsuperior,oldsubordinates;
		let body = _.pick(req.body,['fname','lname',
			'contact','gender','password','access_level'
			,'email','perf','superior','subordinates']);


		employee.fname = body.fname;
		employee.lname = body.lname;
		employee.contact = body.contact;
		employee.gender = body.gender;

		if(req.employee.access_level == 4) {
			oldsuperior = employee.superior;
			oldsubordinates = employee.subordinates;


			employee.email = body.email;
			employee.perf = body.perf;
			employee.password = body.password;
			employee.access_level = body.access_level;
			employee.superior = body.superior;
			employee.subordinates = JSON.parse(body.subordinates);
		}
		employee.save().then((result)=>{

			if(JSON.stringify(oldsuperior) != JSON.stringify(result.superior)) {
				Employee.findOne({
					'_id' : result.superior
				}).then((newSuperior) => {
					let found = _.find(newSuperior.subordinates,result._id)
					if(!found) {
						newSuperior.subordinates.push(result._id);
						newSuperior.save();
					}
				});

				Employee.findOne({
					'_id' : oldsuperior
				}).then((oldSuperior) => {
					oldSuperior.subordinates.remove(result._id);
					oldSuperior.save();
				})
			}
			if(JSON.stringify(oldsubordinates) != JSON.stringify(result.subordinates)) {
				Employee.find({
					'_id' : {
						$in : oldsubordinates
					}
				}).then((oldSubordinates) => {
					for(let i = 0 ; i < oldSubordinates.length ; i++) {
						let found = _.find(result.subordinates,oldSubordinates[i]._id)
						if(!found) {
							oldSubordinates[i].superior = undefined;
							oldSubordinates[i].save()
						}
					}
				});
				Employee.find({
					'_id' : {
						$in : result.subordinates
					}
				}).then((newSubordinates) => {
					for(let i = 0 ; i < newSubordinates.length ; i++) {
						newSubordinates[i].superior = result._id;
						newSubordinates[i].save();
					}
				});
			}
			res.status(200).send({
				status : 200,
				meta : {
					message : result
				}
			});
		})
	}).catch((e) => {
		res.status(400).send({
			status : 400,
			meta : {
				message : e
			}
		});
	})
});	


router.post('/login', upload.array(), (req, res) => {
	let body = _.pick(req.body,['email','password']);
	
	Employee.findByCredentials(body.email, body.password).then((employee) => {
			return employee.generateAuthToken().
			then((token) => {
				res.header('x-auth', token).status(200).send({
					status : 200,
					meta : {
						message : employee
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
	}).catch((e) => {
		res.status(400).send({
			status : 400,
			meta : {
				message : 'Invalid email or password'
			}
		});
	});
});

router.delete('/logout', authenticate, (req, res) => {
	let token = req.header('x-auth');
	req.employee.removeToken(token).then(() => {
		res.status(200).send({
				status : 200,
				meta : {
					message : "Logout Successful"
				}
			});
	}, ()=> {
		res.status(400).send({
			status : 400,
			meta : {
				message : 'Logout request is invalid'
			}
		});
	});
});

router.get('/list', authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		Employee.find({
			'access_level' : {
				$ne : 4
			}
		})
		.then((employees) => {
			if(employees) {
				res.status(200).send({
					status : 200,
					meta : {
						message : employees
					}
				});
			}
			else {
				res.status(400).send({
					status : 400,
					meta : {
						message : 'No employees found'
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

module.exports = router;