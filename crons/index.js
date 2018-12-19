const puppeteer   = require('puppeteer');
const mongoose    = require('mongoose');
const User        = require('./models/user');
const env         = process.env.NODE_ENV || 'development';
const credentials = require('../config/config')['websites'];
const config      = require('../config/config')[env];

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(credentials.github.url+'/login');

  // dom element selectors
  const USERNAME_SELECTOR = '#login_field';
  const PASSWORD_SELECTOR = '#password';
  const BUTTON_SELECTOR = '#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block';

  await page.click(USERNAME_SELECTOR);
  await page.type(credentials.github.email);

  await page.click(PASSWORD_SELECTOR);
  await page.type(credentials.github.pass);

  await page.click(BUTTON_SELECTOR);
  await page.waitForNavigation();

  const userToSearch = 'John';
  const searchUrl = credentials.github.url+'/search?q=${userToSearch}&type=Users&utf8=%E2%9C%93';

  await page.goto(searchUrl);
  await page.waitFor(2 * 1000);

  // const LIST_USERNAME_SELECTOR = '#user_search_results > div.user-list > div:nth-child(1) > div.d-flex > div > a';
  const LIST_USERNAME_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.d-flex > div > a';
  // const LIST_EMAIL_SELECTOR = '#user_search_results > div.user-list > div:nth-child(1) > div.d-flex > div > ul > li:nth-child(2) > a';
  const LIST_EMAIL_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.d-flex > div > ul > li:nth-child(2) > a';
  const LENGTH_SELECTOR_CLASS = 'user-list-item';
  const numPages = await getNumPages(page);

  console.log('Numpages: ', numPages);

  for (let h = 1; h <= numPages; h++) {
    if(h>5) break;
    let pageUrl = searchUrl + '&p=' + h;
    await page.goto(pageUrl);

    let listLength = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, LENGTH_SELECTOR_CLASS);

    for (let i = 1; i <= listLength; i++) {
      // change the index to the next child
      let usernameSelector = LIST_USERNAME_SELECTOR.replace("INDEX", i);
      let emailSelector = LIST_EMAIL_SELECTOR.replace("INDEX", i);

      let username = await page.evaluate((sel) => {
        return document.querySelector(sel).getAttribute('href').replace('/', '');
      }, usernameSelector);

      let email = await page.evaluate((sel) => {
        let element = document.querySelector(sel);
        return element ? element.innerHTML : null;
      }, emailSelector);

      // not all users have emails visible
      if (!email)
        continue;

      console.log(username, ' -> ', email);

      upsertUser({
        username: username,
        email: email,
        dateCrawled: new Date()
      });
    }
  }

 browser.close();
}

async function getNumPages(page) {
  const NUM_USER_SELECTOR = '#js-pjax-container > div.container > div > div.column.three-fourths.codesearch-results.pr-6 > div.d-flex.flex-justify-between.border-bottom.pb-3 > h3';

  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).innerHTML;
    console.log('checkign list');
    // format is: "69,803 users"
    return html.replace(',', '').replace('users', '').trim();
  }, NUM_USER_SELECTOR);

  var numUsers1 = parseInt(inner);

  if( numUsers1 <= 0 || isNaN(numUsers1) == true ){
    let inner1 = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, 'user-list');
    var numUsers1 = parseInt(inner1);
  }

  const numUsers = numUsers1;
  console.log('numUsers: ', numUsers);

  /**
   * GitHub shows 10 results per page, so
   */
  return Math.ceil(numUsers / 10);
}

function upsertUser(userObj) {
  const DB_URL = 'mongodb://localhost/testBot';

  if (mongoose.connection.readyState == 0) {
    mongoose.createConnection(DB_URL);
  }

  // if this email exists, update the entry, don't insert
  const conditions = { email: userObj.email };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  User.findOneAndUpdate(conditions, userObj, options, (err, result) => {
    if (err) {
      throw err;
    }
  });
}

run();
