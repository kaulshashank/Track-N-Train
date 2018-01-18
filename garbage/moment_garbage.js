const moment = require('moment-timezone');
moment().tz("Asia/Kolkata").format();

let from = moment.unix(1506847688910/1000,'milliseconds').format('YYYY-MM-DD');
let to  = moment(from);
to.set('month',to.get('month')+1);
console.log(from,to.format('YYYY-MM-DD'));