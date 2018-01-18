var mongoose = require("mongoose");
var {Workforce} = require('./Workforce');
var ProjectSchema = new mongoose.Schema({
	name: {
		type : String,
		required : true,
		trim : true,
		minlength : 3,
		maxlength : 50
	},
	description: {
		type : String,
		required : true,
		trim : true,
		minlength : 10,
		maxlength : 1000
	},
	client: {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Client'
	},
	workforce: {
		type : mongoose.Schema.Types.ObjectId,
		required : true,
		ref : 'Workforce'
	}
});

ProjectSchema.pre('save', function(next,oldWorkforce) {
	let project = this;

	if(project.isModified('workforce')) {
		Workforce.findOne({
			_id : project.workforce
		}).then((workforce) => {
			if(workforce) {
				workforce.projects.push(project._id);
				workforce.save().then(() => {

					if(oldWorkforce != null) {
						console.log(oldWorkforce,project._id);
						Workforce.findOne({
							'_id' : oldWorkforce
						}).then((result) => {
							result.projects.remove(project._id);
							result.save();
						});
					}
					next();
				}).catch((e) => {
					next(e);
				});
			}
			else {
				var e = new Error('Invalid Data');
				e.msg = 'The project is not assigned to valid workforce id';
				next(e);
			}
		}).catch((e) => {
			next(e);
		});
	}
	else {
		next();
	}

});


ProjectSchema.methods.isEmployeeAuthorized = function(employee) {
	var project = this;
	return Workforce.find({
				'projects' : project.id,
				'members' : employee.id
			}).then((workforce) => {
				if(workforce) {
					return true;
				}
				else {
					return false;
				}
			});
			
}

var Project = mongoose.model("Project", ProjectSchema);

module.exports = {
	Project
}

