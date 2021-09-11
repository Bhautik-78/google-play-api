var gplay = require('google-play-scraper');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/playData";
const { Parser } = require('json2csv');
const ObjectsToCsv = require('objects-to-csv')
var moment = require("moment");
var store = require('google-play-scraper'); // regular non caching version
var memoized = require('google-play-scraper').memoized(); // cache with default options
var memoizedCustom = require('google-play-scraper').memoized({ maxAge: 1000 * 60 });
let cnt = 0;
const countries_tier_1 = [
  'AU',
  'AT',
  'BE',
  'CA',
  'DK',
  'FI',
  'FR',
  'DE',
  'IE',
  'IT',
  'LU',
  'NL',
  'NZ',
  'NO',
  'ES',
  'SE',
  'CH',
  'GB',
  'US'
]
const countries_tier_2 = [
  'AL',
  'DZ',
  'AO',
  'AM',
  'AZ',
  'BH',
  'BD',
  'BB',
  'BZ',
  'BJ',
  'BW',
  'BF',
  'BI',
  'KH',
  'CM',
  'CV',
  'TD',
  'KM',
  'SV',
  'ET',
  'GA',
  'GE',
  'GT',
  'GN',
  'HT',
  'HN',
  'IN',
  'IQ',
  'JM',
  'JO',
  'KE',
  'KW',
  'KG',
  'LB',
  'LS',
  'MG',
  'ML',
  'MR',
  'MU',
  'MD',
  'MN',
  'MZ',
  'NA',
  'NI',
  'NE',
  'NG',
  'PK',
  'SN',
  'LK',
  'SR',
  'SZ',
  'TJ',
  'TG',
  'TT',
  'TN',
  'TM',
  'UG',
  'UZ',
  'ZM'
]
let countries = countries_tier_1;
generateData();
async function generateData() {
  let newData = [];
  for (const item of countries) {
    await getDataFromPlay(item, newData);
  }
  if (newData.length) {
    var fs = require('fs');
    var dir = './' + moment().format('MM-DD-YYYY HH:mm');
    if (!fs.existsSync(dir)) {
      await fs.mkdirSync(dir);
    }
    const csv = new ObjectsToCsv(newData);
    await csv.toDisk(dir + '/data.csv');
  }
}
async function getDataFromPlay(country, newData) {
  const data = await memoized.list({
    collection: gplay.collection.NEW_FREE,
    num: 70,
    country: country
  });
  let newData2 = [];
  for (const item of data) {
    try {
      const item2 = await memoized.app({ appId: item && item.appId, throttle: 10 });
      if (item2) {
        newData2.push(item2)
        console.log(item2.appId, country);
        cnt++;
      } else {
        console.log('app: ', item.appId, ' not found' );
      }
    } catch (err) {
      console.log(err);
    }
  }
  newData2.map((x, i) => {
    const d = {
      SrNo: i,
      AppId: x.appId,
      Title: x.title,
      Relasedate: moment(x.released).format('DD-MM-YYYY'),
      Install: x.maxInstalls,
      AdSupported: x.adSupported,
      ReviewCount: x.reviews,
      ReportDate: moment().format('DD-MM-YYYY'),
      Days: calculateDays(x.released, moment()),
      country
    };
    newData.push(d);
  });
}
function calculateDays(startDate, endDate) {
  var start_date = moment(startDate);
  var end_date = moment(endDate);
  var duration = moment.duration(end_date.diff(start_date));
  var days = Math.round(duration.asDays());
  if(isNaN(days)) {
    return 0;
  } else {
    return days;
  }
}
// gplay.app({ appId: 'com.google.android.apps.translate' })
//     .then((data) => insertIntoMongo(data));
function insertIntoMongo(data) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    console.log("Database created!");
    console.log(data);
    var dbo = db.db("playData");
    // dbo.collection("playApps", function(erra, collections){
    //     if (erra) throw erra;
    //     console.log(collections);
    // });
    // dbo.createCollection("playApps", function (errs, res) {
    //     if (errs) throw errs;
    //     console.log("Collection created!");
    //     db.close();
    // });
    dbo.collection("playApps").insertOne(data, function (errb, res) {
      if (errb) throw errb;
      console.log("1 document inserted");
      db.close();
    });
    db.close();
  });
}
