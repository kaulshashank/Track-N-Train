const express = require('express');
const _ = require('lodash');
var {isLoggedIn} = require('../middleware/middleware');
var {Employee} = require('../../models/Employee');
var router = express.Router();

router.get('/', (req,res) => {
	res.render('index.ejs');
});


router.get('/login', (req, res) => {
	if(req.cookies.user === undefined) {
		res.render('login.ejs', {
			'email' : null
		});
	}
	else {
		res.redirect('/dashboard');
	}
});

router.post('/login', (req, res) => {
	var body = _.pick(req.body,['email','password']);

	Employee.findByCredentials(body.email, body.password).
	then((employee) => {
		return employee.generateAuthToken().then((token) => {
			res.cookie('user', {
				'auth' : token,
				'email' : employee.email,
				'type' : 'employee'
			});
			res.redirect('/dashboard');
		});
	}).catch((e) => {
		res.redirect('/login');
	});

});
router.post('/register', (req, res) => {
	var body = _.pick(req.body,['email','password','type']);

	if(body.type === 'client') {

	}
	else if(body.type === 'employee') {
		var employee = new Employee(body);

		employee.save().then(() => {
			return employee.generateAuthToken().then((token) => {
				res.cookie('user', {
					'auth' : token,
					'email' : employee.email,
					'type' : 'employee'
				});
				res.redirect('/dashboard');
			});
		}).catch((e) => {
			res.redirect('/');
		});
	}

});

router.get('/logout', isLoggedIn, (req, res) => {
	var token = req.cookies.user.auth;
	Employee.findByToken(token).then((employee) => {
		if(employee) {
			employee.removeToken(token).then(() => {
				res.cookie('user', '', {expires: new Date(0)});
				res.redirect('/login');
			});
		}
	})
	.catch((e) => {
		res.redirect('/login');
	});
})

router.get('/dashboard', isLoggedIn, (req, res) => {
	var user = req.cookies.user;
	var options = {
			'email' : user.email
	}
	res.render('dashboard.ejs', options);
	
});
module.exports = router;