const mongoose = require('mongoose');
const _ = require('lodash');

const ReportStructureSchema = mongoose.Schema({
	client : {
		type : mongoose.Schema.Types.ObjectId,
		ref : 'Client',
		required : true
	},
	access_level : {
		type : Number,
		min : 0,
		max : 3,
		required : true
	},
	fields : [{
		field_name : {
			type : String,
			required : true
		},
		field_length : {
			type : Number,
			required : true
		}
	}]
});


const ReportStructure = mongoose.model('ReportStructure',ReportStructureSchema);

module.exports = {
	ReportStructure
}