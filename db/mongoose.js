const mongoose = require("mongoose");

mongoose.Promise = global.Promise;


// Docker mongo
mongoose.connect("mongodb://mongo:27017/trackntrain",{
	useMongoClient : true
}).then(() => {
	console.log('Mongodb Connected');
}).catch((e) => {
	console.log(e);
});


// //Local mongo
// mongoose.connect("mongodb://localhost:27017/Tophawks",{
// 	useMongoClient : true
// }).then(() => {
// 	console.log('Mongodb Connected');
// }).catch((e) => {
// 	console.log(e);
// });

module.exports = {
	mongoose
}
