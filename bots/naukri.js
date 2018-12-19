const puppeteer   = require('puppeteer');
const mongo       = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url         = "mongodb://localhost:27017/";
const env         = process.env.NODE_ENV || 'development';
const credentials = require('../config/config')['websites'];
const config      = require('../config/config')[env];

/* MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("naukri");
  dbo.createCollection("naukris", function (err, res) {
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

  try{
    await page.goto(credentials.naukri.url+'/nlogin/login');
  } catch(e){
    await page.goto(credentials.naukri.url+'/nlogin/login');
    console.log(e);
  }
  await page.waitFor(2 * 1000);
  await page.setViewport({width: 1400, height: 650});
  console.log('Trying Loging In Naukri.com');
  // dom element selectors
  const USERNAME_SELECTOR = '#usernameField';
  const PASSWORD_SELECTOR = '#passwordField';
  const BUTTON_SELECTOR = 'form#loginForm.loginForm div.action.row.mb0 div.col.s12 button.waves-effect.waves-light.btn-large.btn-block.btn-bold.blue-btn';

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(credentials.naukri.email);
  //sometimes due to updates in library "type" does not work 
  //so we can use "keyboard.type" instead of "type"

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(credentials.naukri.pass);

  await page.click(BUTTON_SELECTOR);
  await page.waitForNavigation();

  await page.goto(credentials.naukri.url+'/mnjuser/homepage?id=&prefmsg=1&altresid=');

  const SEARCHBOX = `#qsb-keyskill-sugg`;
  await page.click(SEARCHBOX);
  await page.waitFor(12 * 1000);
  await page.keyboard.type('Laravel');
  
  const LOCATIONBOX = `#qsb-location-sugg`;
  await page.click(LOCATIONBOX);
  await page.keyboard.type('Delhi/NCR');
 
  const EXPERIENCEBOX = `#expDroope-experienceFor`;
  await page.click(EXPERIENCEBOX);
  await page.click('#ul_expDroope-experience > ul > li:nth-child(8) > a');
  await page.click('#qsbFormBtn');
  
  var numPages = await getNumPages(page);
  listLength = 50;
  numPages = parseInt(numPages);

  if (numPages%listLength==0){
    numPages = numPages/listLength;
  } else{
    numPages = parseInt(numPages/listLength)+1;
  }

  console.log('Number of pages: ', numPages);
  var linkId = 2;
  console.log('Opening details page in loop');
  var newPage;

  for (var i = 1; i < numPages; i++ ){//pages
    for (var j = 1; i < listLength; j++) { //items on this single page
      let counter = 2+j;
      let details_selector = 'div.container > div.srp_container > div:nth-child(' + counter+') > a';
      let newUrl;

      /* page.waitForSelector(details_selector, { visible: true }).then(() => {
       newUrl = page.evaluate(() => document.querySelector(details_selector).href);
       console.log(`Opening 1 ${newUrl}`);
        // page.click(details_selector).then(() => { });
      }).catch((err) => {
       newUrl = page.evaluate(() => document.querySelector(details_selector).href);
       console.log(`Opening 2 ${newUrl}`);
        // page.click(details_selector).then(() => { });
      }); */

      if (newUrl != undefined && newUrl != '') {
        try{
          console.log(`Opening try block page : ${newUrl}`);
          await newPage.goto(newUrl);
        } catch (e) {
          await page.goto(newUrl);
          console.log(e);
        }
        newPage.bringToFront();
        console.log('List page='+await page.url() );
        console.log('Opened details page=' + await newPage.url());

        try {
          await page.waitFor(10 * 1000);
          //now need to collect information from the page
          //and apply through page
          console.log('current page=' + await page.url());
          let jdSum = await page.evaluate(() => document.querySelector('div.bgImg > div.wrap > div.lftSec > div.jdSum').textContent);
          let jd = await page.evaluate(() => document.querySelector('div.bgImg > div.wrap > div.lftSec > div.JD').textContent);

          /* let jdSum_selector = 'div.bgImg > div.wrap > div.lftSec > div.jdSum';
          let jd_selector = 'div.bgImg > div.wrap > div.lftSec > div.JD';
          let jdSum = '';
          let jd = '';

          page.waitForSelector(jdSum_selector, { visible: true }).then(() => {
            jdSum =  page.evaluate(() => document.querySelector(jdSum_selector).innerText);
            jd =  page.evaluate(() => document.querySelector(jd_selector).innerText);
          }).catch((err) => {
            jdSum =  page.evaluate(() => document.querySelector(jdSum_selector).innerText);
            jd =  page.evaluate(() => document.querySelector(jd_selector).innerText);
          }); */
          
          MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("naukris");
            var myobj = {
              jdsum: jdSum,
              jd: jd
            };
            dbo.collection("naukris").insertOne(myobj, function (err, res) {
              if (err) throw err;
              console.log("1 page inserted");
              db.close();
            });
          });
        } catch (e) {
          console.log(e);
          console.log('Taking Screen shot of the current page');
          await page.screenshot({
            path: 'screenshots/naukri.png',
            fullPage: true
          });
        }
        await page.waitFor(2 * 1000);
      }
    }
  }
  
    // browser.close();
}

async function getNumPages(page) {
  await page.waitFor(2 * 1000);
  let inner = await page.evaluate(() => document.querySelector('div.count > div.small_title > span').innerText);
  var pageNumber = inner.split('of');
  var numLoan1 = parseInt(pageNumber[1]);
  if( numLoan1 <= 0 || isNaN(numLoan1) == true ){
    var numLoan1 = 0;
  }
  console.log('Count=' + numLoan1);
  return numLoan1;
}

run();
