const puppeteer   = require('puppeteer');
const csvFilePath = './rates.csv';
const csv         = require('csvtojson');
const env         = process.env.NODE_ENV || 'development';
const credentials = require('../config/config')['websites'];
const config      = require('../config/config')[env];

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();

  await page.goto(credentials.commloan_staging.url+'/login');
  await page.setViewport({width: 1300, height: 650});
  console.log('Trying Loging In');
  // dom element selectors
  const USERNAME_SELECTOR = '#username';
  const PASSWORD_SELECTOR = '#password';
  const BUTTON_SELECTOR = 'div#page-content-wrapper div.customforms.login form.form-validate.form-horizontal fieldset.well div.control-group div.controls button.btn.btn-primary';
  let cats = '#tab-container > div.owl-carousel.owl-loaded.owl-drag > div.owl-stage-outer > div > div:nth-child(INDEX) > div > span > a';

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(credentials.commloan_staging.email);
  //sometimes due to updates in library "type" does not work 
  //so we can use "keyboard.type" instead of "type"

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(credentials.commloan_staging.pass);

  await page.click(BUTTON_SELECTOR);
  await page.waitForNavigation();
  
  const logObj = await csv().fromFile(csvFilePath);
  console.log('Number of pages to check: ', logObj.length);
  const logsUrl = credentials.commloan_staging.url+'/index.php?option=com_lender&view=lender&layout=rates&lenderID=LENDERID&onboard=ONBOARD';

   for (let d of logObj){
    let logsUrlFinal = logsUrl.replace("LENDERID", d.LenderID);
    logsUrlFinal = logsUrlFinal.replace("ONBOARD", d.Id);

    await page.goto(logsUrlFinal);
    await page.waitFor(5 * 1000);
    
    await page.screenshot({
      path: 'screenshots/'+d.LenderID+'_'+d.Id+'.png',
      fullPage: true
    });

    //now need to fecth all categories and capture screen shots
    
  }

  browser.close();
}

run();
