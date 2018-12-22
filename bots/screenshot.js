const puppeteer   = require('puppeteer');
// const puppeteer   = require('puppeteer-core');
const fs          = require('fs');
const csv         = require('csvtojson');
const nodemailer  = require("nodemailer");
//usage
//node bots/screenshot.js bots/sites.csv r                    // for responsive mode
//node bots/screenshot.js https://www.commloan.com r          // webpage name on command line
//node bots/screenshot.js https://www.commloan.com            // no responsive mode

async function run() {
  var site, responsive;
  const browser  = await puppeteer.launch();
  // const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
  const page     = await browser.newPage();
  var site       = process.argv.slice(2)[0];
  var responsive = process.argv.slice(3)[0];
  var date       = new Date().toJSON().slice(0,10).replace(/-/g,'_');
  var rootDir    = 'public/screen_shots';

  if (!fs.existsSync(rootDir)){
      fs.mkdirSync(rootDir);
  }
  if (!fs.existsSync(`${rootDir}/${date}`)){
      fs.mkdirSync(`${rootDir}/${date}`);
  }

  if(site){
    //if site is url or a csv file
    if(site.search(/.csv$/i)!== -1){
      console.log('Reading from CSV file');
      const csvFilePath = './'+site;
      const logObj      = await csv().fromFile(csvFilePath);
      console.log('Number of sites to check: ', logObj.length);

      for (let d of logObj){
        var filename = d.Sites.replace(/[^a-z0-9\.]/gi, '_').toLowerCase();
        filename     = filename.replace(/^https___www\./, '');
        filename     = filename.replace(/^http___www\./, '');
        filename     = filename.replace(/^https/, '');
        filename     = filename.replace(/^http/, '');
        filename     = filename.replace(/^www\./, '');
        var siteName = extractRootDomain(d.Sites.toLowerCase());
        console.log(siteName);
        await page.goto(d.Sites);
        console.log('taking screenshot of: '+d.Sites);
        if (!fs.existsSync(`${rootDir}/${date}/${siteName}`)){
            fs.mkdirSync(`${rootDir}/${date}/${siteName}`);
        }

        await page.screenshot({
          path: `${rootDir}/${date}/${siteName}/${filename}.png`,
          fullPage: true
        });

        // Ann array of viewport sizes for different devices.
        if(responsive == 'responsive' || responsive == 'r'){
          const viewports = [1600, 1280, 1024, 800, 768, 600, 480, 412, 414, 375, 360, 320];

          await page.goto(d.Sites);
          await page.waitFor(5 * 1000);

          for(let i=0; i < viewports.length; i++) {
            let vw = viewports[i];
            console.log('taking screenshots of screen size: '+vw);
            // The height doesn't matter since we are screenshotting the full page.
            await page.setViewport({
              width: vw,
              height: 1000
            });

            await page.screenshot({
              path: `${rootDir}/${date}/${siteName}/${filename}-screen-${vw}.png`,
              fullPage: true
            });
          }
        }
      }
    } else{
      console.log('Reading from URL');
      var filename = site.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      filename = filename.replace(/[^https]/, '');

      await page.goto(site);
      console.log('taking screenshot of: '+site);
      
      await page.screenshot({
        path: `${rootDir}/${date}/${siteName}/${filename}.png`,
        fullPage: true
      });

      // Ann array of viewport sizes for different devices.
      if(responsive == 'responsive' || responsive == 'r'){
        const viewports = [1600, 1280, 1024, 800, 768, 600, 480, 412, 414, 375, 360, 320];

        await page.goto(site);
        await page.waitFor(5 * 1000);
        
        for(let i=0; i < viewports.length; i++) {
          let vw = viewports[i];
          console.log('taking screenshots of screen size: '+vw);
          // The height doesn't matter since we are screenshotting the full page.
          await page.setViewport({
            width: vw,
            height: 1000
          });

          await page.screenshot({
            path: `${rootDir}/${date}/${siteName}/${filename}-screen-${vw}.png`,
            fullPage: true
          });
        }
      }
    }
  }

    var smtpTransport = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: "youremail@mail.com",
        pass: "your_pass"
      }
    });
    
    var mailOptions = {
        to : 'ramnaresh.kuswaha@onsumaye.com',
        subject : 'testBot Auto Screen Grabber',
        text : 'ScreenShots has been taken.'
    };

    smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
        console.log(error);
      } else{
        console.log("Email sent ");
      }
    });

  browser.close();
}

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

// To address those who want the "root domain," use this function:
function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain 
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}

run()