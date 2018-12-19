const puppeteer   = require('puppeteer');
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

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(credentials.commloan_staging.email);
  //sometimes due to updates in library "type" does not work 
  //so we can use "keyboard.type" instead of "type"

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(credentials.commloan_staging.pass);

  await page.click(BUTTON_SELECTOR);
  await page.waitForNavigation();
  
  console.log('Going to Loan Pipeline - Lead tab');
  const searchUrl = credentials.commloan_staging.url+'/index.php?option=com_processor&view=superadminpipeline&dashboardStatus=0';

  await page.goto(searchUrl);
  await page.waitFor(2 * 1000);

  const LIST_LOAN_SELECTOR = '#tableDefault0 > tr:nth-child(INDEX) > td:nth-child(2) > div > a:nth-child(1)';
  const LENGTH_SELECTOR_CLASS = '#tableDefault0 > tr > td:nth-child(1) > div > input[type=checkbox]';
  
  console.log('Fetching total Pages in Lead tab');
  
  const numPages = await getNumPages(page);

  console.log('Number of pages: ', numPages);

  for (let h = 1; h <= numPages; h++) {
    if(h>5) break;

    console.log('Going to Page:'+h);
    let pageUrl = credentials.commloan_staging.url+'/index.php?option=com_processor&view=superadminpipeline&dashboardStatus=0&page='+h;
    await page.goto(pageUrl);

    let listLength = await page.evaluate((sel) => {
      return document.querySelector(sel).length;
    }, LENGTH_SELECTOR_CLASS);
    
    listLength = 20;

    console.log('Page:'+h+' contains '+listLength+' loans');

    for (let i = 1; i <= listLength; i++) {
      console.log('Processing Loan : '+i);
      await page.goto(pageUrl);
      // change the index to the next child
      let bifSelector = LIST_LOAN_SELECTOR.replace("INDEX", i);

      let bif_link = await page.evaluate((sel) => {
        return document.querySelector(sel).getAttribute('href').replace('/', '');
      }, bifSelector);

      let loanno = await page.evaluate((sel) => {
        return document.querySelector(sel).innerHTML;
      }, bifSelector);

      console.log(loanno);

      if(bif_link!='' || bif_link!=null){
        console.log('Opening BIF for '+loanno);
        await page.goto(bif_link);
        await page.waitFor(2 * 1000);

        console.log('Running pricing engine');
        await page.click('#runpricingengine');
        
        try{
          await page.waitForNavigation();
        } catch(e){
          console.log(e);
          console.log('Taking Screen shot of the current page');
          await page.screenshot({
            path: 'screenshots/'+loanno+'.png',
            fullPage: true
          });
        }

        let newurl = page.url();

        if (newurl==bif_link) {
            console.log(' Form validation errors');
        }

        let results = await page.evaluate((sel) => {
          let html = '';
          if( document.querySelector(sel)!=null ){
            html = document.querySelector(sel).innerHTML;
          }
          return html.trim();
        }, '#totalLenderSearch');

        console.log('Total Search Results: '+results);
      } else{
        console.log('Ends');
      }
    }
  }

 browser.close();
}

async function getNumPages(page) {
  const NUM_USER_SELECTOR = '#page_list > ul #f4';

  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).innerHTML;
    console.log('checkign list');
    return html.trim();
  }, NUM_USER_SELECTOR);

  var numLoan1 = parseInt(inner);

  if( numLoan1 <= 0 || isNaN(numLoan1) == true ){
    let inner1 = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, '#page_list');
    var numLoan1 = parseInt(inner1);
  }

  return numLoan1;
}

run();
