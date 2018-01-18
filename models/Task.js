var mongoose = require('mongoose');
var {Project} = require('./Project');
var {Workforce} = require('./Workforce');
var {Employee}  = require('./Employee'); 
const _ = require('lodash');

var TaskSchema = new mongoose.Schema({
	name : {
		type : String,
		trim : true,
		minlength : 5,
		maxlength : 100,
		required: true
	},
	description: {
		type : String,
		minlength : 10,
		maxlength : 1000,
		trim : true,
		required : true
	},
	priority : {
		type: String,
		required: true,
		enum  :['High','Medium','Low']
	},
	status : {
		type  :String,
		required : true,
		default : 'Assigned',
		enum : ['Open','Completed','Hold']
	},
	project: {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Project',
		required : true
	},
	employee: {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Employee',
		required : true
	},
	deadline: {
		type : Date,
		required : true
	},
	location : {
		type : String,
		requied : true,
		trim : true,
		minlength : 10
	}
});


TaskSchema.pre('save', function(next) {
	var task = this;
	Employee.findOne({
		'_id' : task.employee
	}).then((employee) => {

		if((!employee) || employee.access_level != 0) {
			var e = new Error();
			e.msg = 'Employee with id not found';
			throw e;
		}

		Project.findOne({
			'_id' : task.project
		}).then((project) => {
			if(project) {

				Workforce.findOne({
					'_id' : project.workforce
				}).then((workforce) => {
					
					let found = _.find(workforce.members, task.employee);
					if(found) {
						next();
					}
					else {
						var e = new Error();
						e.msg = 'Employee does not belong to the workforce';
						throw e;
					}					
				});
			}
			else {
				var e = new Error();
				e.msg = 'Project with id not found';
				throw e;	
			}
		});
	})
	.catch((e) => {
		next(e);
	});
});


TaskSchema.statics.findTasksByProjectId = function(projectId) {
	var Task = this;

	return Task.find({
		'project' : projectId
	});
}

var Task = mongoose.model("Task", TaskSchema);

module.exports = {
	Task
}
