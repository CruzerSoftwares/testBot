const puppeteer   = require('puppeteer');
const mongo       = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url         = "mongodb://localhost:27017/";
const env         = process.env.NODE_ENV || 'development';
const credentials = require('../config/config')['websites'];
const config      = require('../config/config')[env];

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
  
  console.log('Going to One Connect');
  const searchUrl = credentials.oneteam.url+'/oneconnect';

  await page.goto(searchUrl);
  await page.waitFor(10 * 1000);

  const postBySel = '#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream > div.joms-stream__header > div.joms-stream__meta > a';
  const descriptionSel = '#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream > div.joms-stream__body > p';
  const employeeSel = '#community-wrap > div > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream > div.joms-stream__body > p > span > a';
  console.log('Scraping Only first Post');

  let postBySel1 = postBySel.replace("INDEX", 1);
  let descriptionSel1 = descriptionSel.replace("INDEX", 1);
  let employeeSel1 = employeeSel.replace("INDEX", 1);

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

  let results = {
    description: description,
    postBy: postBy,
    employee: employee
  };

  console.log(results);
  console.log('Saving Posts');

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("oneteam");
    dbo.collection("employees").insertOne(results, function (err, res) {
      if (err) throw err;
      console.log("1 document inserted: " + res.insertedCount);
      db.close();
    });
  });

  //now liking the post 
  //#community-wrap > div >div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream > div.joms-stream__actions > a
  const likeSel = '#community-wrap > div >div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream > div.joms-stream__actions > a';
  await page.click(likeSel);
  console.log("Post Liked");
  await page.waitFor(2 * 1000);

  browser.close();
}

async function getNumPages(page) {
  await page.waitFor(2 * 1000);
  let inner = await page.evaluate(() => document.querySelector('#community-wrap > div.joms-body > div.joms-main > div:nth-child(4) > div > div.joms-stream__container > div.joms-stream').length);
  return inner;
}

run();
