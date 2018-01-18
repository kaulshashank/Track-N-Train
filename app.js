// DEPENDENCIES
let express  = require('express');
let app = express();
let cookieParser = require('cookie-parser');
let ejs = require('ejs');
let bodyParser = require('body-parser');
let socketIO = require('socket.io');
let http = require('http');
let path = require('path');
let _ = require('lodash');



// App Setup
let server = http.createServer(app);
const port = process.env.PORT || 8000;
let io = socketIO(server);

// Middleware
app.set('view engine',ejs);
app.set('views',path.join(__dirname,'views'));
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.urlencoded({
	extended : false
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Database
let {mongoose} = require(path.join(__dirname,'db')+'/mongoose');


// WEB ROUTES
let index = require('./routes/web/index');

// API ROUTES
let employeeAPI = require('./routes/api/employee');
let clientAPI = require('./routes/api/client');
let attendanceAPI = require('./routes/api/attendance');
let workforceAPI = require('./routes/api/workforce');
let projectAPI = require('./routes/api/project');
let taskAPI = require('./routes/api/task');
let reportAPI = require('./routes/api/report');
let reportStructureAPI = require('./routes/api/reportstructure');

// ROUTES CONFIG

app.use('/',index);
app.use('/api/employee',employeeAPI);
app.use('/api/client', clientAPI);
app.use('/api/attendance', attendanceAPI);
app.use('/api/workforce', workforceAPI);
app.use('/api/project', projectAPI);
app.use('/api/task', taskAPI);
app.use('/api/report', reportAPI);
app.use('/api/reportstructure', reportStructureAPI);

// Models
let {Employee} = require('./models/Employee');
//Sockets
let users = {

};

io.on('connection', (socket, userOpts) => {
	let email = socket.request._query['email'];
	users.email = socket;
	Employee.findOne({
			'email' : email
		}).then((employee) => {

			socket.on('userDiscon', () => {
				socket.broadcast.emit('userDiscon',employee);
				users.email = null;
		// console.log('User disconnected : ',email);
			});

		socket.on('userCon', () => {

			socket.broadcast.emit('userCon',employee);
		});

		socket.on('newLoc', (location) => {
			let loc = _.pick(location,['lat','lng']);
			loc.email = email;
			socket.broadcast.emit('newLoc',loc);
			console.log(loc);
			employee.lat = loc.lat;
			employee.lng = loc.lng;
			employee.save();
		});

	});

});


server.listen(port, function() {
	console.log("The App runs on the port " + port);
});
