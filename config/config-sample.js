var config = {
    development: {
        //url to be used in link generation
        url: 'http://yourdomain/testBot/',
        //mongodb connection settings
        database: {
            host:   '127.0.0.1',
            port:   '27017',
            db:     'site_dev'
        },
        //server details
        server: {
            host: 'your_host',
            port: 'your_port'
        }
    },
    production: {
        //url to be used in link generation
        url: 'http://yourdomain/testBot/',
        //mongodb connection settings
        database: {
            host: '127.0.0.1',
            port: '27017',
            db:     'site'
        },
        //server details
        server: {
            host:   'your_host',
            port:   'your_port'
        }
    },
    websites: {
        //common online site credentials
        naukri: {
            url: 'https://www.naukri.com',
            email: 'youremail@gmail.com',
            pass: 'your_password',
        },
        github: {
            url: 'https://github.com',
            email: 'youremail@gmail.com',
            pass: 'your_password',
        },
        oneteam: {
            url: 'https://oneteam.onsumaye.com',
            email: 'youremail@gmail.com',
            pass: 'your_password',
        },
        ops: {
            url: 'https://ops.onsumaye.com',
            email: 'youremail@gmail.com',
            pass: 'your_password',
        },
        commloan_staging: {
            url: 'https://www.commloan-staging.com',
            email: 'youremail@gmail.com',
            pass: 'your_password',
        },
        commloan: {
            url: 'https://www.commloan.com',
            email: 'youremail@gmail.com',
            pass: 'your_password',
        },
    }
};

module.exports = config;