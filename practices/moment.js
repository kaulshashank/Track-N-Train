const moment = require('moment-timezone');
moment().tz("Asia/Kolkata").format();


var date = new Date();
var wrapper = moment.tz(date, "Asia/Kolkata");
console.log(wrapper.get('hour'));	