const puppeteer   = require('puppeteer');
const mongo       = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url         = "mongodb://localhost:27017/";
const env         = process.env.NODE_ENV || 'development';
const credentials = require('../config/config')['websites'];
const config      = require('../config/config')[env];

/*
MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("oneteam");
  dbo.collection("employees").drop(function (err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    db.close();
  });
});

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("oneteam");
  dbo.createCollection("employees", function (err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});*/

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(credentials.oneteam.url+'/login');
  await page.waitFor(2 * 1000);
  await page.setViewport({width: 1400, height: 650});
  console.log('Trying Loging in');
  // dom element selectors
  const USERNAME_SELECTOR = '#username';
  const PASSWORD_SELECTOR = '#password';
  const BUTTON_SELECTOR = '#content > div.customforms.login > form > fieldset > div.controls > button';

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(credentials.oneteam.email);
  //sometimes due to updates in library "type" does not work 
  //so we can use "keyboard.type" instead of "type"

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(credentials.oneteam.pass);

  await page.click(BUTTON_SELECTOR);
  await page.waitForNavigation();
  
  console.log('Going to Dashboard');
  const searchUrl = credentials.oneteam.url+'/oneconnect';

  await page.goto(searchUrl);
  await page.waitFor(2 * 1000);

  var numPages = await getNumPages(page);
  numPages = 10;
  console.log('Number of pages: ', numPages);

  /* MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("oneteam");
    var myquery = {
      postBy: /^a/
    };
    dbo.collection("employees").deleteMany(myquery, function (err, obj) {
      if (err) throw err;
      console.log(obj.result.n + " document(s) deleted");
      db.close();
    });
  }); */

  await page.waitFor(2 * 1000);
  var results = [];
  const postBySel = '#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div:nth-child(INDEX) > div.joms-stream__header > div.joms-stream__meta > a';
  const descriptionSel = '#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div:nth-child(INDEX) > div.joms-stream__body > p';
  const employeeSel = '#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div:nth-child(INDEX) > div.joms-stream__body > p > span > a';

  console.log('Scraping Posts');

  for (let i = 1; i <= numPages; i++ ){//posts
    let postBySel1 = postBySel.replace("INDEX", i);
    let descriptionSel1 = descriptionSel.replace("INDEX", i);
    let employeeSel1 = employeeSel.replace("INDEX", i);

    let postBy = await page.evaluate((sel) => {
      let element = document.querySelector(sel);
      return element ? element.textContent : null;
    }, postBySel1);

    let description = await page.evaluate((sel) => {
      let element = document.querySelector(sel);
      return element ? element.textContent : null;
    }, descriptionSel1);

    let employee = await page.evaluate((sel) => {
      let element = document.querySelector(sel);
      return element ? element.innerHTML : null;
    }, employeeSel1);

    let myobj = {
      description: description,
      postBy: postBy,
      employee: employee
    };

    results.push(myobj);
  }

  console.log(results);
  console.log('Saving Posts');

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("oneteam");
    dbo.collection("employees").insertMany(results, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });

  // to start mongodb : mongod -dbpath /home/ram/lampstack-7.2.3-0/apache2/htdocs/testBot/data
  // to view db records : db.employees.find().pretty()

/*   for(res of results){
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("oneteam");
      let emp = {
        description: res.description,
        postBy: res.postBy,
        employee: res.employee
      };

      // if(res.description!=null){
        dbo.collection("employees").insertOne(emp, function (err, res) {
          if (err) throw err;
          // console.log("1 record inserted");
          db.close();
        });
      // }
    });
  } */
  browser.close();
}

async function getNumPages(page) {
  await page.waitFor(2 * 1000);
  let inner = await page.evaluate(() => document.querySelector('#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream').length);
  return inner;
}

run();
