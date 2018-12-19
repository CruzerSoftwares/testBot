const puppeteer   = require('puppeteer');
const mongo       = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url         = "mongodb://localhost:27017/";
const env         = process.env.NODE_ENV || 'development';
const credentials = require('../config/config')['websites'];
const config      = require('../config/config')[env];

/* MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("ops");
  dbo.collection("logs").drop(function (err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    db.close();
  });
}); */

/* MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("ops");
  dbo.createCollection("logs", function (err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
}); */

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(credentials.ops.url+'/index.php?m=tasks');
  await page.waitFor(2 * 1000);
  await page.setViewport({width: 1400, height: 650});
  console.log('Trying Loging in');
  // dom element selectors
  const USERNAME_SELECTOR = '.std > tbody:nth-child(4) > tr:nth-child(1) > td:nth-child(2) > input:nth-child(1)';
  const PASSWORD_SELECTOR = '.std > tbody:nth-child(4) > tr:nth-child(2) > td:nth-child(2) > input:nth-child(1)';
  const BUTTON_SELECTOR = '.button';

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(credentials.ops.email);
  //sometimes due to updates in library "type" does not work 
  //so we can use "keyboard.type" instead of "type"

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(credentials.ops.pass);

  await page.click(BUTTON_SELECTOR);
  
  const logsUrl = credentials.ops.url+'/index.php?m=tasks&a=view&task_id=10904&tab=1';
  console.log('going to log entry page');
  
  await page.goto(logsUrl);
  await page.waitFor(5 * 1000);
  console.log('Trying to fill form');

  let dateFld = '.tabox > form:nth-child(3) > table:nth-child(7) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > input:nth-child(1)';
  let hoursFld = '.tabox > form:nth-child(3) > table:nth-child(7) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2) > input:nth-child(1)';
  let descFld  = '.textarea';
  let btnFld   = '.tabox > form:nth-child(3) > table:nth-child(7) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(1) > input:nth-child(1)';
  
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth();
  mm = parseInt(mm)+1;
  
  let yyyy = today.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  let dateVal = yyyy + '-' + mm + '-' + dd + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
  let hoursVal = '7:30';
  let descVal = 'Worked on Processing Module: Restructured form Added data to the newly added forms';

  console.log('Trying to Enter log');

  await page.evaluate((sel, val) => {
    let element = document.querySelector(sel);
    return element ? element.value = val : '';
  }, dateFld, dateVal);

  await page.click(hoursFld);
  await page.keyboard.type(hoursVal);

  await page.click(descFld);
  await page.keyboard.type(descVal);

  await page.click(btnFld);
  await page.waitForNavigation();
  console.log('Log saved');
  
  //insert into database
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("ops");
    let emp = {
      employee: 'RN Kushwaha',
      date: dateVal,
      hours: hoursVal,
      description: descVal,
      created: new Date()
    };

    dbo.collection("logs").insertOne(emp, function (err, res) {
      if (err) throw err;
      // console.log("1 record inserted");
      db.close();
    });
  });

  //close the browser
  browser.close();
}

run();
