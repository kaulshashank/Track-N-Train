const express = require('express');
const path = require('path');
var router = express.Router();
const _ = require('lodash');
var {Client} = require(path.join('../../','models','Client'));
var {authenticateClient} = require('../middleware/middleware');
var {authenticate} = require('../middleware/middleware');

var bcrypt = require('bcryptjs');
var multer  = require('multer');
var upload = multer();


router.post('/', upload.array(), authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
	var body = _.pick(req.body,['password','email','company']);

	var client = new Client(body);

	client.save().then((success) => {
		return client.generateAuthToken();
	}).then((token) =>{
		res.header('x-auth', token).status(200).send({
				status : 200,
				meta : {
					message : client
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

router.put('/:cid', upload.array(), authenticate, (req, res) => {
	if(req.employee.access_level == 4) {
		let body = _.pick(req.body,['company','email','password']);
		Client.findOne({
			'_id' : req.params.cid
		}).then((client) => {
			if(client) {
				client.set(body);
				client.save()
				.then((result) => {
					res.status(200).send({
						status : 200,
						meta : {
							message : result
						}
					});
				});
			}
			else {
				let e = new Error();
				e.msg = 'No client with id found';
				throw e;
			}
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
					message : e.msg
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


router.get('/me' ,authenticateClient,  (req, res) => {
	res.status(200).send({
		status : 200,
		meta : {
			message : req.client
		}
	});
});


router.post('/login', upload.array(), (req, res) => {
	var body = _.pick(req.body,['email','password']);
	
	Client.findByCredentials(body.email, body.password).then((client) => {
			return client.generateAuthToken().
			then((token) => {
				res.header('x-auth', token).status(200).send({
					status : 200,
					meta : {
						message : client
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

router.delete('/logout', authenticateClient, (req, res) => {
	var token = req.header('x-auth');
	req.clients.removeToken(token).then(() => {
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
		Client.find({})
		.then((clients) => {
			if(clients) {
				res.status(200).send({
					status : 200,
					meta : {
						message : clients
					}
				});
			}
			else {
				res.status(400).send({
					status : 400,
					meta : {
						message : 'No clients found'
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