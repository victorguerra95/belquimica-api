module.exports = function(app) {
	'use strict';

    const Local = app.get('models').Local;
    const Post = app.get('models').Post;
    const User = app.get('models').User;
    const Profile = app.get('models').Profile;
    const Address = app.get('models').Address;
    const Country = app.get('models').Country;
    const State = app.get('models').State;
    const City = app.get('models').City;
    const District = app.get('models').District;
    const Challenge = app.get('models').Challenge;
    const Category = app.get('models').Category;
    const JobLocal = app.get('models').JobLocal;

    const Sequelize = require('sequelize');
    const Sequelizito = app.get('sequelize');

	var request = require('request');
	var querystring = require('querystring');
	const Promise = require('promise');
	const config = require('../config');
	const Item = app.get('models').Item;
	const utils = require('../utils/utils')();
	const async = require('async');
	const moment = require('moment');
	const currencyFormatter = require('currency-formatter');
    const _ = require('lodash');

    var DISTRICT_ID = 2;

    var q_locales = [];
    var q_locales_status = false;

    var q_locales_aux = [];
    var q_locales_aux_status = false;

    var m_locales = [];
    var m_locales_status = false;

    var arr_districts = 
    ["World",
    "Campinas",
    "São Paulo",
    "Recife",
    "New York",
    "San Francisco",
    "Ibiza",
    "Menlo Park",
    "San José",
    "Dubai",
    "Rio de Janeiro",
    "Paris" ];

    var exclude_ids_sp = ["213163910"];
    var exclude_ids_sp_host = [551];

    var exclude_ids_rec = ["213762864"];
    var exclude_ids_rec_host = [1157];

    /*
        https://www.instagram.com/explore/locations/214459798/menlo-park-california/
        7	Menlo Park	menlopark	2019-05-01 21:21:29.547+00	2019-05-01 21:21:29.547+00		7
        https://www.instagram.com/explore/locations/213070948/san-jose-california/
        8	San José	sanjose	2019-05-01 21:21:29.547+00	2019-05-01 21:21:29.547+00		8
        https://www.instagram.com/explore/locations/213281320/dubai-united-arab-emirates/
        9	Dubai	dubai	2019-05-01 21:21:29.547+00	2019-05-01 21:21:29.547+00		9
        https://www.instagram.com/explore/locations/405027146/rio-de-janeiro/
        10	Rio de Janeiro	riodejaneiro	2019-05-01 21:21:29.547+00	2019-05-01 21:21:29.547+00		
        https://www.instagram.com/explore/locations/6889842/paris-france/
        11	Paris	paris	2019-05-01 21:21:29.547+00	2019-05-01 21:21:29.547+00		
        */

    var code_challenge_main = "";

    function getStoriesFake(filter){

        //startLocalesAutoUpdate(filter.locales);

        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);
    
            var result_found = false;
            
            var stores_main = [];

            /*
            page.on('request', interceptedRequest => {
                if(interceptedRequest.url().match("stories/reel/seen")){

                }
            })*/

            page.on('response', response => {
                var url = response.url();
                
                if(url.match("show_story_viewer_list")){
                    console.log("response code: " + response.url());
                    console.log("response code: " + response.request().postData());
                    console.log("response code: " + response.text());
                    console.log("response code: " + response.json());
    
                    response.text().then((value) => {
                        console.log("result found");

                        result_found = true;

                        stores_main = JSON.parse(value).data.reels_media[0].items;
                    })		
                }

                /*
                if(url.match("stories/reel/seen")){
                    console.log("SEEN response code: " + response.url());
                    console.log("SEEN response code: " + response.request().postData());
                    console.log("SEEN response code: " + response.text());
                    console.log("SEEN response code: " + response.json());
    
                    response.text().then((value) => {
                        console.log("SEEN result found: " + value);
                        console.log("SEEN result found: " + JSON.stringify(value));

                        //result_found = true;

                        //stores_main = JSON.parse(value).data.reels_media[0].items;
                    })		
                }*/

            });
    
            console.log("vai: " + new Date());
            
            console.log("0-1-zap-open | entrando no IG...");
            await page.goto(`https://www.instagram.com/accounts/login/`, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
    
            await page.waitForSelector('input[name="username"]');
    
            //await page.type('input[name="username"]', 'curtanoitesaopaulo');
            await page.type('input[name="username"]', filter.user.name);
            await page.type('input[name="password"]', filter.user.password);
            await page.click('button[type="submit"]');
    
            //await page.waitForSelector('div[class="COOzN "]');

            await page.waitFor(10000);

            ////await page.screenshot({path: 'abb1.png'});

            console.log(page.url());
            if(page.url().match("challenge")){
                
                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s1.png'});

                await page.click('span.idhGk button');
                console.log("pega o codigo em 40 segundos");
                await page.waitFor(40000);
                console.log("foi!");

                setCodeChallenge();
                console.log("go setar and wait 5s!");
                await page.waitFor(5000);

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s2.png'});

                //var code_data = require('./challenge.json');
                //var code = code_data.code;
                var code = code_challenge_main;
                console.log("aguarda o 5 segundos, code: " + code);
                await page.waitFor(5000);

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s3.png'});

                await page.type('input._281Ls', code);
                await page.click('span.idhGk button');

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s4.png'});

                console.log("aguarda o 5 segundos, enviou");
                await page.waitFor(5000);

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s5.png'});
            }
            
            var arr_locales = filter.locales;
            var arr_locales_index = 0;
            while(true){
                try{

                    await page.goto(`https://www.instagram.com/`, {
                        waitUntil: 'networkidle2',
                        timeout: 3000000
                    });

                    await page.waitFor(5000);
                    console.log("seguranca espera 5 segundos");

                    var location_main = arr_locales[arr_locales_index];
                    arr_locales_index++;
                    if(arr_locales_index >= arr_locales.length){
                        arr_locales_index = 0;
                    }

                    var url_profile = "https://www.instagram.com/explore/locations/" + location_main.id;
                    console.log("LOCATION URL: " + url_profile);
                    console.log("LOCATION ID: " + location_main.id);
                    console.log("LOCATION DISTRICT: " + location_main.district_id);
                    await page.goto(url_profile, {
                        waitUntil: 'networkidle2',
                        timeout: 3000000
                    });
            
                    console.log("ENTROU NOS STORIES");

                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s1.png'});

                    await page.waitForSelector('div.VU4al', {
                        timeout: 8000
                    });
                    await page.click('div.VU4al');        
                    
                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s2.png'});

                    var stories_count = 0;
                    await page.waitForSelector('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]', {
                        timeout: 8000
                    });

                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s3.png'});
                    ////await page.screenshot({path: 'abb2.png'});
            
                    stories_count = await page.evaluate(() => {
                        return document.querySelectorAll('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]').length;
                    });
                    console.log("Temos de stories: " + stories_count);

                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s4.png'});

                    console.log("xau xau: " + new Date());

                    /*
                    console.log("sigura 3");
                    await page.waitFor(3000);
                    console.log("clica em pause");
                    await page.click('button.dCJp8');
                    console.log("sigura 3");
                    await page.waitFor(3000);
                    console.log("printa");
                    await page.screenshot({path: 'asilas.png'});
                    console.log("sigura 10000");
                    await page.waitFor(3000000);*/
                    
                    for (let index = 0; index < stories_count; index++) {

                        var stories_data = JSON.parse(JSON.stringify(stores_main[index]));
                        stories_data.district_id = location_main.district_id;
                        stories_data.filter = filter;
                        createPost(stories_data);
                        //prev button.B-R4p

                        /*
                        await page.waitForSelector('button.ow3u_', {
                            timeout: 15000
                        });
                        await page.click('button.ow3u_');
                        await page.waitFor(3000);

                        console.log("oi " + index);*/
                    }

                    console.log("Vamos p/ prox rodada em 10 segundos...");
                    //await page.waitFor(10000);

                }catch(err){
                    console.log("err: " + err);
                    console.log("Vamos p/ prox rodada em 10 segundos...");
                    await page.waitFor(10000);
                }

            }
    
            browser.close();
            //getStories(filter);
            return true;
        };
    
        scrape().then((value) => {
            console.log(value)
        })  
    } 

    function getStories(filter){

        //startLocalesAutoUpdate(filter.locales);

        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);
    
            var result_found = false;
            
            var stores_main = [];

            /*
            page.on('request', interceptedRequest => {
                if(interceptedRequest.url().match("stories/reel/seen")){

                }
            })*/

            page.on('response', response => {
                var url = response.url();
                
                if(url.match("show_story_viewer_list")){
                    console.log("response code: " + response.url());
                    console.log("response code: " + response.request().postData());
                    console.log("response code: " + response.text());
                    console.log("response code: " + response.json());
    
                    response.text().then((value) => {
                        console.log("result found");

                        result_found = true;

                        stores_main = JSON.parse(value).data.reels_media[0].items;
                    })		
                }

                /*
                if(url.match("stories/reel/seen")){
                    console.log("SEEN response code: " + response.url());
                    console.log("SEEN response code: " + response.request().postData());
                    console.log("SEEN response code: " + response.text());
                    console.log("SEEN response code: " + response.json());
    
                    response.text().then((value) => {
                        console.log("SEEN result found: " + value);
                        console.log("SEEN result found: " + JSON.stringify(value));

                        //result_found = true;

                        //stores_main = JSON.parse(value).data.reels_media[0].items;
                    })		
                }*/

            });
    
            console.log("vai: " + new Date());
            
            console.log("0-1-zap-open | entrando no IG...");
            await page.goto(`https://www.instagram.com/accounts/login/`, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
    
            await page.waitForSelector('input[name="username"]');
    
            //await page.type('input[name="username"]', 'curtanoitesaopaulo');
            await page.type('input[name="username"]', filter.user.name);
            await page.type('input[name="password"]', filter.user.password);
            await page.click('button[type="submit"]');
    
            //await page.waitForSelector('div[class="COOzN "]');

            await page.waitFor(10000);

            ////await page.screenshot({path: 'abb1.png'});

            console.log(page.url());
            if(page.url().match("challenge")){
                
                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s1.png'});

                await page.click('span.idhGk button');
                console.log("pega o codigo em 40 segundos");
                await page.waitFor(40000);
                console.log("foi!");

                setCodeChallenge();
                console.log("go setar and wait 5s!");
                await page.waitFor(5000);

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s2.png'});

                //var code_data = require('./challenge.json');
                //var code = code_data.code;
                var code = code_challenge_main;
                console.log("aguarda o 5 segundos, code: " + code);
                await page.waitFor(5000);

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s3.png'});

                await page.type('input._281Ls', code);
                await page.click('span.idhGk button');

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s4.png'});

                console.log("aguarda o 5 segundos, enviou");
                await page.waitFor(5000);

                //await page.screenshot({path: 'aGL1dis' + filter.locales[0].district_id + '-s5.png'});
            }
            
            var arr_locales = filter.locales;
            var arr_locales_index = 0;
            while(true){
                try{

                    await page.goto(`https://www.instagram.com/`, {
                        waitUntil: 'networkidle2',
                        timeout: 3000000
                    });

                    await page.waitFor(5000);
                    console.log("seguranca espera 5 segundos");

                    var location_main = arr_locales[arr_locales_index];
                    arr_locales_index++;
                    if(arr_locales_index >= arr_locales.length){
                        arr_locales_index = 0;
                    }

                    var url_profile = "https://www.instagram.com/explore/locations/" + location_main.id;
                    console.log("LOCATION URL: " + url_profile);
                    console.log("LOCATION ID: " + location_main.id);
                    console.log("LOCATION DISTRICT: " + location_main.district_id);
                    await page.goto(url_profile, {
                        waitUntil: 'networkidle2',
                        timeout: 3000000
                    });
            
                    console.log("ENTROU NOS STORIES");

                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s1.png'});

                    await page.waitForSelector('div.VU4al', {
                        timeout: 8000
                    });
                    await page.click('div.VU4al');        
                    
                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s2.png'});

                    var stories_count = 0;
                    await page.waitForSelector('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]', {
                        timeout: 8000
                    });

                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s3.png'});
                    ////await page.screenshot({path: 'abb2.png'});
            
                    stories_count = await page.evaluate(() => {
                        return document.querySelectorAll('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]').length;
                    });
                    console.log("Temos de stories: " + stories_count);

                    //await page.screenshot({path: 'abe-dis' + location_main.district_id + '-s4.png'});

                    console.log("xau xau: " + new Date());

                    /*
                    console.log("sigura 3");
                    await page.waitFor(3000);
                    console.log("clica em pause");
                    await page.click('button.dCJp8');
                    console.log("sigura 3");
                    await page.waitFor(3000);
                    console.log("printa");
                    await page.screenshot({path: 'asilas.png'});
                    console.log("sigura 10000");
                    await page.waitFor(3000000);*/
                    
                    for (let index = 0; index < stories_count; index++) {

                        var stories_data = JSON.parse(JSON.stringify(stores_main[index]));
                        stories_data.district_id = location_main.district_id;
                        stories_data.filter = filter;
                        createPost(stories_data);
                        //prev button.B-R4p

                        await page.waitForSelector('button.ow3u_', {
                            timeout: 15000
                        });
                        await page.click('button.ow3u_');
                        await page.waitFor(3000);

                        console.log("oi " + index);
                    }

                    console.log("Vamos p/ prox rodada em 10 segundos...");
                    //await page.waitFor(10000);

                }catch(err){
                    console.log("err: " + err);
                    console.log("Vamos p/ prox rodada em 10 segundos...");
                    await page.waitFor(10000);
                }

            }
    
            browser.close();
            //getStories(filter);
            return true;
        };
    
        scrape().then((value) => {
            console.log(value)
        })  
    }    

    function getStoriesBk(filter){

        var fisrt = false;

        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);
    
            var result_found = false;
            
            var stores_main = [];
            page.on('response', response => {
                //console.log("response code: ", response.status());
                var url = response.url();
                
                if(url.match("show_story_viewer_list")){
                    console.log("response code: " + response.url());
                    console.log("response code: " + response.request().postData());
                    console.log("response code: " + response.text());
                    console.log("response code: " + response.json());
    
                    response.text().then((value) => {
                        console.log("result found");
                        //resolve(JSON.parse(value));

                        result_found = true;

                        //createStories(JSON.parse(value).data.reels_media[0].items);
                        stores_main = JSON.parse(value).data.reels_media[0].items;
                    })		
                }
                //console.log("response code: ", response.text());
                //console.log("response code: ", response.json());
                //if(response.url().match("/graphql/query/)){
                // /}
                // do something here
            });
    
            console.log("vai: " + new Date());
            
            console.log("0-1-zap-open | entrando no IG...");
            await page.goto(`https://www.instagram.com/accounts/login/`, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
    
            await page.waitForSelector('input[name="username"]');
    
            //await page.type('input[name="username"]', 'curtanoitesaopaulo');
            await page.type('input[name="username"]', 'buscapesado');
            await page.type('input[name="password"]', 'Ukx945395');
            await page.click('button[type="submit"]');
    
            //await page.waitForSelector('div[class="COOzN "]');

            await page.waitFor(10000);

            ////await page.screenshot({path: 'abb1.png'});

            console.log(page.url());
            if(page.url().match("challenge")){
                
                await page.click('span.idhGk button');
                console.log("pega o codigo em 40 segundos");
                await page.waitFor(40000);
                console.log("foi!");

                var code_data = require('./challenge.json');
                var code = code_data.code;
                console.log("aguarda o 5 segundos, code: " + code);
                await page.waitFor(5000);
                ////await page.screenshot({path: 'aGL1.png'});

                await page.type('input._281Ls', code);
                await page.click('span.idhGk button');

                console.log("aguarda o 5 segundos, enviou");
                await page.waitFor(5000);
                ////await page.screenshot({path: 'aGL2.png'});
            }
            

            ////await page.screenshot({path: 'abb1.png'});
            //var arr_locales = [{id: 213163910, district_id: 2}, {id: 213762864, district_id: 3}, {id: 44961364, district_id: 5}, {id: 218435836, district_id: 6}];
            var arr_locales = [{id: 213762864, district_id: 3}, {id: 218435836, district_id: 6}];
            //var arr_locales = [{id: 212988663, district_id: 4}];
            var arr_locales_index = 0;
            while(true){
                
                await page.goto(`https://www.instagram.com/`, {
                    waitUntil: 'networkidle2',
                    timeout: 3000000
                });

                //await page.waitForSelector('div[class="COOzN "]');

                await page.waitFor(5000);
                console.log("seguranca espera 5 segundos");

                //var url_profile = "https://www.instagram.com/stories/" + filter.user;
                //var url_profile = "https://www.instagram.com/explore/locations/" + filter.user;
                //var url_profile = "https://www.instagram.com/" + filter.user;

                var location_main = arr_locales[arr_locales_index];
                arr_locales_index++;
                if(arr_locales_index >= arr_locales.length){
                    arr_locales_index = 0;
                }

                var url_profile = "https://www.instagram.com/explore/locations/" + location_main.id;
                console.log("LOCATION URL: " + url_profile);
                console.log("LOCATION ID: " + location_main.id);
                console.log("LOCATION DISTRICT: " + location_main.district_id);
                await page.goto(url_profile, {
                    waitUntil: 'networkidle2',
                    timeout: 3000000
                });
        
                console.log("ENTROU NOS STORIES");

                ////await page.screenshot({path: 'abb1.png'});
                
                //locations div.VU4al
                //profile img._6q-tv

                try{

                    await page.waitForSelector('div.VU4al', {
                        timeout: 8000
                    });
                    await page.click('div.VU4al');             

                    var stories_count = 0;
                    await page.waitForSelector('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]', {
                        timeout: 8000
                    });

                    ////await page.screenshot({path: 'abb2.png'});
            
                    stories_count = await page.evaluate(() => {
                        return document.querySelectorAll('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]').length;
                    });
                    console.log("Temos de stories: " + stories_count);

                    console.log("xau xau: " + new Date());

                    for (let index = 0; index < stories_count; index++) {
                        stores_main[index].district_id = location_main.district_id;
                        createPost(stores_main[index]);

                        //prev button.B-R4p
                        await page.waitForSelector('button.ow3u_', {
                            timeout: 15000
                        });

                        //await page.screenshot({path: 'abb2.png'});

                        //await page.click('div.z6Odz');
                        await page.click('button.ow3u_');
                        await page.waitFor(3000);


                        ////await page.screenshot({path: 'bb' + index + '.png'});

                        console.log("oi " + index);
                    }

                    console.log("Vamos p/ prox rodada em 10 segundos...");
                    //await page.waitFor(10000);

                }catch(err){
                    console.log("err: " + err);
                    console.log("Vamos p/ prox rodada em 10 segundos...");
                    await page.waitFor(10000);
                }

            }
    
            browser.close();
            //getStories(filter);
            return true;
        };
    
        scrape().then((value) => {
            console.log(value)
        })  
    }

    function changeTextChallenge(text, id){

        if(!id){
            id = "1";
        }

        Challenge.update({text: text}, {
            where: {
                id: parseInt(id)
            }
        }).then(updatePost => {
            console.log("updated code: " + updatePost + " - " + text);
        });

        var new_code = {
            code: text
        }
        const fs = require('fs');
        fs.writeFile("./models/challenge.json", JSON.stringify(new_code), function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        }); 
    }

    function setCodeChallenge(){
        Challenge.findOne({
            where: {
                id: 1
            }
        }).then(c => {
            code_challenge_main = c.text;
            console.log("code set: "  + code_challenge_main);
        });
    }

    function createPost(stories){

        try{

            var local = {};
            var local_info = stories.tappable_objects;
            for (let index = 0; index < local_info.length; index++) {
                var e = local_info[index];
                if(e.__typename.match("GraphTappableLocation")){
                    local.origin_id = e.id;
                    local.origin_url = "https://www.instagram.com/explore/locations/" + e.id;
                    break;
                }
            }

            var profile = {};
            profile.origin_id = stories.owner.id;
            profile.origin_username = stories.owner.username;
            profile.origin_pic_url = stories.owner.profile_pic_url;

            var post = {};
            post.origin_id = stories.id;
            post.is_video = stories.is_video;
            post.expired_date = new Date( moment(new Date(stories.expiring_at_timestamp * 1000)) );//.subtract(3, 'hours') );
            post.taken_date = new Date( moment(new Date(stories.taken_at_timestamp * 1000)) );//.subtract(3, 'hours') );
            if(stories.is_video){
                if(stories.video_resources[1]){
                    post.url = stories.video_resources[1].src;
                }else{
                    post.url = stories.video_resources[0].src;
                }
            }
            post.display_url = stories.display_url;
            post.data = JSON.parse(JSON.stringify(stories));

            post.local = local;
            post.profile = profile;

            //console.log("ele: " + JSON.stringify(post.district_id));
            //console.log("post_district: " + JSON.stringify(stories.district_id));
            
            async.auto({
                post_exist: function(done) {

                    Post.findOne({
                        where:{
                            origin_id: post.origin_id
                        }
                    }).then(postExistData => {	

                        if(postExistData){
                            done(null, true);
                        }else{
                            done(null, false);
                        }
                    });
                },
                local: ['post_exist', function(results, done) {

                    if(results.post_exist){
                        done(null, null);	
                    }else{
                        Local.findOrCreate({
                            where: {
                                origin_id: post.local.origin_id
                            },
                            defaults: post.local
                        }).then(localData => {	
                            
                            var local_pump = JSON.parse(JSON.stringify(localData[0]));
                            local_pump.district_id = stories.district_id;

                            if(localData[1] || local_pump.address_id == null){
                                //console.log("post_district go: " + JSON.stringify(stories.district_id));
                                //startCrawlerLocales(local_pump);   
                                registerNewJobLocal(local_pump);
                            }else{
                                console.log("local já existe: " + localData[0].name || "sem nome");
                            }

                            /*
                            if(!stories.is_more){
                                startLocaleGetPosts(local_pump, stories.filter);
                            }*/

                            done(null, localData[0]);
                        });
                    }
                }],
                profile: ['post_exist', function(results, done) {

                    if(results.post_exist){
                        done(null, null);	
                    }else{
                        Profile.findOrCreate({
                            where: {
                                origin_id: post.profile.origin_id
                            },
                            defaults: post.profile
                        }).then(profileData => {	

                            done(null, profileData[0]);	

                        });	
                    }
                }],
            }, function(err, results) {
                if(err) {
                    console.log("ERRR: " + err);
                    reject(err);
                    return;
                }

                if(results.post_exist){
                    console.log("\n\npost exist: " + post.origin_id);
                }else{

                    delete post.local;
                    post.local_id = results.local.id;
                    delete post.profile;
                    post.profile_id = results.profile.id;

                    Post.create(
                        post
                    ).then(profileDataNewCreate => {	

                        console.log("\n\npost CRIADO CRIADO: " + post.origin_id);

                    });	

                }
            
            });

        }catch(err){
            console.log("Error createPost: " + err);
        }

    }

    function registerNewJobLocal(local){
        
        JobLocal.create({
            local_id: local.id,
            district_id: local.district_id
        }).then(jobLocalCreated => {	

            console.log("jobLocalCreated: " + JSON.stringify(jobLocalCreated));

        });	
    }

    function startCrawlerLocales(local){

        if( q_locales.length <= q_locales_aux.length ){
            q_locales.push(local);
            crawlerLocales();
        }else{
            q_locales_aux.push(local);
            crawlerLocalesAux();
        }
        
    }

    function crawlerLocales(){
        //var q_locales = [];
        //var q_locales_status = false;
        if(!q_locales_status && q_locales.length > 0){
            q_locales_status = true;

            const puppeteer = require('puppeteer')

            let scrape = async () => {
                const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                var page = await browser.newPage()
                const override = Object.assign(page.viewport(), {width: 1366});
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
                await page.setViewport(override);
        
                console.log("vai NOVO NOVO: " + new Date());
                
                console.log("0-1-zap-open | entrando no IG...");

                var exit_crawler = false;
                while(exit_crawler == false){

                    if(q_locales.length > 0){

                        var local = q_locales[0];

                        console.log("[CL] MAIN restam " + q_locales.length + " locais");

                        try{
                            await page.goto(local.origin_url, {
                                waitUntil: 'networkidle2',
                                timeout: 5000
                            });
                        }catch(err){
                            console.log("ERRO OPEN");
                            //await page.screenshot({path: 'err-new-' + localData[0].id + '.png'});    
                        }

                        try{
                            await page.waitForSelector('img.FFVAD', {
                                timeout: 5000
                            });
                        }catch(err){
                            console.log("em new LOCAL, NADA DE IMAGENS");
                            //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                        }

                        try{
                            await page.waitForSelector('meta[property="place:location:latitude"]', {
                                timeout: 5000
                            });
                        }catch(err){
                            console.log("nada nada de latitude");
                            //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                        }

                        const local_info = await page.evaluate(() => {

                            var local = {};

                            var lat_long = {};
                            if(document.querySelector('meta[property="place:location:latitude"]')){
                                lat_long.lat = parseFloat(document.querySelector('meta[property="place:location:latitude"]').getAttribute("content"));
                                lat_long.long = parseFloat(document.querySelector('meta[property="place:location:longitude"]').getAttribute("content"));

                                local.lat_long = lat_long;
                            }

                            if(document.querySelector('div.o0Sr9 h1')){
                                local.name = document.querySelector('div.o0Sr9 h1').innerText;
                                if(local.name.match("Photos and Videos of ")){
                                    local.name = local.name.replace("Photos and Videos of ", "");
                                }
                            }

                            if(document.querySelector('img.FFVAD')){
                                local.pic_url = document.querySelector('img.FFVAD').getAttribute("src");

                                var photos = [];
                                var arr = document.querySelectorAll('img.FFVAD');
                                for (let index = arr.length - 1; index >= 0; index--) {
                                    var p = arr[index];
                                    photos.push(p.src);
                                }

                                local.photos = photos;

                            }
            
                            if(JSON.stringify(local) === '{}'){
                                local = null;
                            }

                            return local;
                        });

                        if(local_info){

                            var local_info_google = {};
                            if(local_info.name && local_info.lat_long && local_info.lat_long.lat){

                                var s_district = arr_districts[local.district_id];
                                var name_term = formatTerm(local_info.name);
                                if(!name_term.match(s_district)){
                                    name_term += " " + s_district;
                                    name_term = formatTerm(name_term);
                                }

                                var url = "https://www.google.com/maps/search/" + name_term + "/@" + local_info.lat_long.lat + "," + local_info.lat_long.long + ",18.14z/data=!3m1!4b1?hl=pt-BR"
                                console.log("get in google: " + url);
                                await page.goto(url, {  
                                    waitUntil: 'networkidle2',
                                    timeout: 3000000
                                });
                    
                                try{
                                    await page.waitForSelector('h1.section-hero-header-title-title', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });
                    
                                }catch(err){
                                    console.log("error papi: " + err);
                                    if(err.message && err.message.match("failed: timeout")){
                    
                                        var check_next_page = await page.$('span.n7lv7yjyC35__left');
                                        if(check_next_page != null){
                                            console.log("É UMA LISTA");   
                    
                                            await page.click('h3.section-result-title');
                    
                                        }else{
                                            console.log("error comportamento estranho: " + page.url());
                                        }
                    
                                    }else{
                                        console.log("error desconhecido: " + page.url());
                                    }
                                }
                    
                                try{
                    
                                    await page.waitForSelector('button[data-value="Compartilhar"]', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });
                                    await page.click('button[data-value="Compartilhar"]');
                                    await page.waitForSelector('button[data-tooltip="Incorporar um mapa"]', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });
                                    await page.click('button[data-tooltip="Incorporar um mapa"]');
                                    
                    
                                    local_info_google = await page.evaluate(() => {
                                        var local = {};
                                        //address
                                        if(document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link')){
                                            var address = document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link').innerText;
                                            if(address && address.length > 0){
                                                local.address = address;
                                            }
                                        }
                                        
                                        if(document.querySelector('div[data-tooltip="Expandir horário de funcionamento"] span.section-info-hour-text')){
                    
                                            var arr_days = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
                                            
                                            if(document.querySelector('table.widget-pane-info-open-hours-row-table-hoverable')){
                                                var divs_time = document.querySelectorAll('table.widget-pane-info-open-hours-row-table-hoverable tbody tr');
                                                if(divs_time && divs_time.length >0){
                                                    var arr_time = [];
                                                    for (let index = 0; index < divs_time.length; index++) {
                                                        var div_time = divs_time[index];   
                                                        //arr_time.push( { day: div_time.querySelectorAll('td')[0].innerHTML, time: div_time.querySelectorAll('td')[1].innerHTML } );
                                                        var new_time = { day: div_time.querySelector('th div').innerText.trim(), time: div_time.querySelectorAll('td')[0].querySelector('ul li').innerText, index: arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) + 1 }
                                                        arr_time[ arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) ] = new_time;
                                                    }
                                                    local.time_work = arr_time;
                                                }
                                            }
                    
                                        }
                    
                                        
                                        if(document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link')){
                                            var phone = document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link').innerText;
                                            if(phone && phone.length >0){
                                                local.phone = phone;
                                            }
                                        }
                    
                                        
                                        if(document.querySelector('div.section-editorial-quote span')){
                                            var description = document.querySelector('div.section-editorial-quote span').innerText;
                                            if(description && description.length >0){
                                                local.description = description;
                                            }
                                        }
                    
                                        if(document.querySelector('input.section-embed-map-input')){
                                            var map_embed = document.querySelector('input.section-embed-map-input').value;
                                            map_embed = map_embed.substring( map_embed.indexOf('src=') + 5, map_embed.indexOf('" wi') );
                                            if(map_embed && map_embed.length >0){
                                                local.map_embed = map_embed;
                                            }
                                        }
                                        
                                        /*
                                        if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                            var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                            if(category && category.length >0){
                                                local.category = category;
                                            }
                                        }*/
                    
                                        if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                            var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                            if(category && category.length >0){
                                                local.category = category;
                                            }
                                        }
                    
                                        if(document.querySelector('span.section-star-display')){
                                            var rating_value = document.querySelector('span.section-star-display').innerText;
                                            if(rating_value && rating_value.length >0){
                                                local.rating_value = rating_value;
                                            }
                                        }
                    
                                        if(document.querySelector('button[jsaction="pane.rating.moreReviews"]')){
                                            var rating_comments = document.querySelector('button[jsaction="pane.rating.moreReviews"]').innerText;
                                            if(rating_comments && rating_comments.length >0){
                                                rating_comments = rating_comments.replace("(", "");
                                                rating_comments = rating_comments.replace(")", "");
                                                local.rating_comments = rating_comments;
                                            }
                                        }
                    
                                        if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                                            var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                                            if(image_origin && image_origin.length > 0){
                                                local.image_origin = image_origin;
                                            }
                                        }
                                        /*
                                        if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                                            var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                                            if(image_origin && image_origin.length > 0){
                                                local.image_origin = image_origin;
                                            }
                                        }*/
                    
                                        if(JSON.stringify(local) === '{}'){
                                            local = null;
                                        }
                    
                                        return local;
                                    });

                                    if(local_info_google){
                                        var origin_google_url = page.url();
                                        local_info_google.origin_google_url = origin_google_url;

                                        var local_info_google_en = {};
                                        var url_translate = origin_google_url.replace("hl=pt-BR", "hl=en");

                                        await page.goto(url_translate, {
                                            waitUntil: 'networkidle2',
                                            timeout: 3000000
                                        });
                            
                                        try{
                                            await page.waitForSelector('h1.section-hero-header-title-title', {
                                                waitUntil: 'networkidle2',
                                                timeout: 5000
                                            });

                                            local_info_google_en = await page.evaluate(() => {

                                                var local = {};

                                                if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                                    var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                                    if(category && category.length >0){
                                                        local.category = category;
                                                    }
                                                }

                                                if(document.querySelector('div.section-editorial-quote span')){
                                                    var description = document.querySelector('div.section-editorial-quote span').innerText;
                                                    if(description && description.length >0){
                                                        local.description = description;
                                                    }
                                                }

                                                return local;
                                            })                                            
                            
                                        }catch(err){
                                            console.log("translate erro step 1: " + err);
                                        }

                                        if(JSON.stringify(local_info_google_en) !== "{}"){
                                            if(local_info_google_en.category){
                                                local_info_google.category_en = local_info_google_en.category;
                                            }
                                            if(local_info_google_en.description){
                                                local_info_google.description_en = local_info_google_en.description;
                                            }
                                        }

                                    }else{
                                        console.log("Google deyu errado!");
                                    }
                    
                                }catch(err){
                                    console.log("Google deyu errado!");
                                }                                

                            }
                            
                            if(local_info_google){
                                local_info.google_data_scrape = local_info_google;
                                local_info.google_data_scrape_check = true ;
                            }

                            console.log("atualizando...");
                            //console.log("Local_info: " + JSON.stringify(local_info));
                            localUpdate(local_info, local);
                            
                        }

                        q_locales.splice(0, 1);

                    }else{
                        exit_crawler = true;
                    }

                }
                
                browser.close();
                return true;
            };
        
            scrape().then((value) => {
                q_locales_status = false;
            })             
        }
    }

    function crawlerLocalesAux(){
        //var q_locales = [];
        //var q_locales_status = false;
        if(!q_locales_aux_status && q_locales_aux.length > 0){
            q_locales_aux_status = true;

            const puppeteer = require('puppeteer')

            let scrape = async () => {
                const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                var page = await browser.newPage()
                const override = Object.assign(page.viewport(), {width: 1366});
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
                await page.setViewport(override);
        
                console.log("vai NOVO NOVO: " + new Date());
                
                console.log("0-1-zap-open | entrando no IG...");

                var exit_crawler = false;
                while(exit_crawler == false){

                    if(q_locales_aux.length > 0){

                        var local = q_locales_aux[0];

                        console.log("[CL] AUX restam " + q_locales_aux.length + " locais");

                        try{
                            await page.goto(local.origin_url, {
                                waitUntil: 'networkidle2',
                                timeout: 5000
                            });
                        }catch(err){
                            console.log("ERRO OPEN");
                            //await page.screenshot({path: 'err-new-' + localData[0].id + '.png'});    
                        }

                        try{
                            await page.waitForSelector('img.FFVAD', {
                                timeout: 5000
                            });
                        }catch(err){
                            console.log("em new LOCAL, NADA DE IMAGENS");
                            //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                        }

                        try{
                            await page.waitForSelector('meta[property="place:location:latitude"]', {
                                timeout: 5000
                            });
                        }catch(err){
                            console.log("nada nada de latitude");
                            //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                        }

                        const local_info = await page.evaluate(() => {

                            var local = {};

                            var lat_long = {};
                            if(document.querySelector('meta[property="place:location:latitude"]')){
                                lat_long.lat = parseFloat(document.querySelector('meta[property="place:location:latitude"]').getAttribute("content"));
                                lat_long.long = parseFloat(document.querySelector('meta[property="place:location:longitude"]').getAttribute("content"));

                                local.lat_long = lat_long;
                            }

                            if(document.querySelector('div.o0Sr9 h1')){
                                local.name = document.querySelector('div.o0Sr9 h1').innerText;
                                if(local.name.match("Photos and Videos of ")){
                                    local.name = local.name.replace("Photos and Videos of ", "");
                                }
                            }

                            if(document.querySelector('img.FFVAD')){
                                local.pic_url = document.querySelector('img.FFVAD').getAttribute("src");

                                var photos = [];
                                var arr = document.querySelectorAll('img.FFVAD');
                                for (let index = arr.length - 1; index >= 0; index--) {
                                    var p = arr[index];
                                    photos.push(p.src);
                                }

                                local.photos = photos;

                            }
            
                            if(JSON.stringify(local) === '{}'){
                                local = null;
                            }

                            return local;
                        });

                        if(local_info){

                            var local_info_google = {};
                            if(local_info.name && local_info.lat_long && local_info.lat_long.lat){

                                var s_district = arr_districts[local.district_id];
                                var name_term = formatTerm(local_info.name);
                                if(!name_term.match(s_district)){
                                    name_term += " " + s_district;
                                    name_term = formatTerm(name_term);
                                }

                                var url = "https://www.google.com/maps/search/" + name_term + "/@" + local_info.lat_long.lat + "," + local_info.lat_long.long + ",18.14z/data=!3m1!4b1?hl=pt-BR"
                                console.log("get in google: " + url);

                                await page.goto(url, {
                                    waitUntil: 'networkidle2',
                                    timeout: 3000000
                                });
                    
                                try{
                                    await page.waitForSelector('h1.section-hero-header-title-title', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });
                    
                                }catch(err){
                                    console.log("error papi: " + err);
                                    if(err.message && err.message.match("failed: timeout")){
                    
                                        var check_next_page = await page.$('span.n7lv7yjyC35__left');
                                        if(check_next_page != null){
                                            console.log("É UMA LISTA");   
                    
                                            await page.click('h3.section-result-title');
                    
                                        }else{
                                            console.log("error comportamento estranho: " + page.url());
                                        }
                    
                                    }else{
                                        console.log("error desconhecido: " + page.url());
                                    }
                                }
                    
                                try{
                    
                                    await page.waitForSelector('button[data-value="Compartilhar"]', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });
                                    await page.click('button[data-value="Compartilhar"]');
                                    await page.waitForSelector('button[data-tooltip="Incorporar um mapa"]', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });
                                    await page.click('button[data-tooltip="Incorporar um mapa"]');
                                    
                    
                                    local_info_google = await page.evaluate(() => {
                                        var local = {};
                                        //address
                                        if(document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link')){
                                            var address = document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link').innerText;
                                            if(address && address.length > 0){
                                                local.address = address;
                                            }
                                        }
                                        
                                        if(document.querySelector('div[data-tooltip="Expandir horário de funcionamento"] span.section-info-hour-text')){
                    
                                            var arr_days = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
                                            
                                            if(document.querySelector('table.widget-pane-info-open-hours-row-table-hoverable')){
                                                var divs_time = document.querySelectorAll('table.widget-pane-info-open-hours-row-table-hoverable tbody tr');
                                                if(divs_time && divs_time.length >0){
                                                    var arr_time = [];
                                                    for (let index = 0; index < divs_time.length; index++) {
                                                        var div_time = divs_time[index];   
                                                        //arr_time.push( { day: div_time.querySelectorAll('td')[0].innerHTML, time: div_time.querySelectorAll('td')[1].innerHTML } );
                                                        var new_time = { day: div_time.querySelector('th div').innerText.trim(), time: div_time.querySelectorAll('td')[0].querySelector('ul li').innerText, index: arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) + 1 }
                                                        arr_time[ arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) ] = new_time;
                                                    }
                                                    local.time_work = arr_time;
                                                }
                                            }
                    
                                        }
                    
                                        
                                        if(document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link')){
                                            var phone = document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link').innerText;
                                            if(phone && phone.length >0){
                                                local.phone = phone;
                                            }
                                        }
                    
                                        
                                        if(document.querySelector('div.section-editorial-quote span')){
                                            var description = document.querySelector('div.section-editorial-quote span').innerText;
                                            if(description && description.length >0){
                                                local.description = description;
                                            }
                                        }
                    
                                        if(document.querySelector('input.section-embed-map-input')){
                                            var map_embed = document.querySelector('input.section-embed-map-input').value;
                                            map_embed = map_embed.substring( map_embed.indexOf('src=') + 5, map_embed.indexOf('" wi') );
                                            if(map_embed && map_embed.length >0){
                                                local.map_embed = map_embed;
                                            }
                                        }
                                        
                                        /*
                                        if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                            var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                            if(category && category.length >0){
                                                local.category = category;
                                            }
                                        }*/
                    
                                        if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                            var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                            if(category && category.length >0){
                                                local.category = category;
                                            }
                                        }
                    
                                        if(document.querySelector('span.section-star-display')){
                                            var rating_value = document.querySelector('span.section-star-display').innerText;
                                            if(rating_value && rating_value.length >0){
                                                local.rating_value = rating_value;
                                            }
                                        }
                    
                                        if(document.querySelector('button[jsaction="pane.rating.moreReviews"]')){
                                            var rating_comments = document.querySelector('button[jsaction="pane.rating.moreReviews"]').innerText;
                                            if(rating_comments && rating_comments.length >0){
                                                rating_comments = rating_comments.replace("(", "");
                                                rating_comments = rating_comments.replace(")", "");
                                                local.rating_comments = rating_comments;
                                            }
                                        }
                    
                                        if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                                            var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                                            if(image_origin && image_origin.length > 0){
                                                local.image_origin = image_origin;
                                            }
                                        }
                                        /*
                                        if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                                            var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                                            if(image_origin && image_origin.length > 0){
                                                local.image_origin = image_origin;
                                            }
                                        }*/
                    
                                        if(JSON.stringify(local) === '{}'){
                                            local = null;
                                        }
                    
                                        return local;
                                    });

                                    if(local_info_google){
                                        var origin_google_url = page.url();
                                        local_info_google.origin_google_url = origin_google_url;

                                        var local_info_google_en = {};
                                        var url_translate = origin_google_url.replace("hl=pt-BR", "hl=en");

                                        await page.goto(url_translate, {
                                            waitUntil: 'networkidle2',
                                            timeout: 3000000
                                        });
                            
                                        try{
                                            await page.waitForSelector('h1.section-hero-header-title-title', {
                                                waitUntil: 'networkidle2',
                                                timeout: 5000
                                            });

                                            local_info_google_en = await page.evaluate(() => {

                                                var local = {};

                                                if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                                    var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                                    if(category && category.length >0){
                                                        local.category = category;
                                                    }
                                                }

                                                if(document.querySelector('div.section-editorial-quote span')){
                                                    var description = document.querySelector('div.section-editorial-quote span').innerText;
                                                    if(description && description.length >0){
                                                        local.description = description;
                                                    }
                                                }

                                                return local;
                                            })                                            
                            
                                        }catch(err){
                                            console.log("translate erro step 1: " + err);
                                        }

                                        if(JSON.stringify(local_info_google_en) !== "{}"){
                                            if(local_info_google_en.category){
                                                local_info_google.category_en = local_info_google_en.category;
                                            }
                                            if(local_info_google_en.description){
                                                local_info_google.description_en = local_info_google_en.description;
                                            }
                                        }

                                    }else{
                                        console.log("Google deyu errado!");
                                    }
                    
                                }catch(err){
                                    console.log("Google deyu errado!");
                                }                                

                            }
                            
                            if(local_info_google){
                                local_info.google_data_scrape = local_info_google;
                                local_info.google_data_scrape_check = true ;
                            }

                            console.log("atualizando...");
                            //console.log("Local_info: " + JSON.stringify(local_info));
                            localUpdate(local_info, local);
                            
                        }

                        q_locales_aux.splice(0, 1);

                    }else{
                        exit_crawler = true;
                    }

                }
                
                browser.close();
                return true;
            };
        
            scrape().then((value) => {
                q_locales_aux_status = false;
            })             
        }
    }

    function localUpdate(local_result, local_main){
        Address.create({
            //line: local_result.full_address,
            lat: local_result.lat_long.lat,
            long: local_result.lat_long.long,
            district_id: local_main.district_id
        }).then(addressCreate => {	

            var changes = {address_id: addressCreate.id, name: local_result.name, origin_picture_url: local_result.pic_url, google_data_scrape_check: true};
            if(local_result.photos && local_result.photos.length > 0){
                changes.photos = local_result.photos;
            }

            if(local_result.google_data_scrape){
                changes.google_data_scrape = local_result.google_data_scrape;
            }

            if(changes.name && changes.name.length > 0){
                changes.name_term = formatWord(changes.name);
            }

            console.log("Atualizado: " + local_main.id + " | " + local_result.name);

            Local.update(changes, {
                where: {
                    id: local_main.id
                }
            }).then(updatePost => {
            });

            //updateGoogleDataLocal(localData[0].id);
            
        });
    }

    function startLocaleGetPosts(local, filter){
        console.log("STARTA PORRA");
        var add = true;
        if(local.district_id == 2 && exclude_ids_sp.indexOf(local.origin_id) != -1){
            add = false;
        }else if(local.district_id == 3 && exclude_ids_rec.indexOf(local.origin_id) != -1){
            add = false;
        }

        if(add){
            console.log("TACA LE PAUUUU: " + JSON.stringify(m_locales));
            m_locales.push({id: local.origin_id, district_id: local.district_id});
            if(m_locales_status == false){
                m_locales_status = true;
                localeGetPosts(filter);
            }
        }else{
            console.log("A********* NAO DA");
        }
    }

    function localeGetPosts(filter){

        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);

            var stores_main = [];

            page.on('response', response => {
                var url = response.url();
                
                if(url.match("show_story_viewer_list")){
                    console.log("url stories target: " + response.url());
    
                    response.text().then((value) => {
                        stores_main = JSON.parse(value).data.reels_media[0].items;
                    })		
                }

                if(url.match("include_reel") && url.match("include_logged_out")){
                    console.log("STORIES response code: " + response.url());
    
                    response.text().then((value) => {
                        console.log("have stories: " + value);

                        if(JSON.parse(value).data.location.reel){
                            have_stories = true;
                        }else{
                            have_stories = false;
                        }
                    })		
                }

                if(url.match("stories/reel/seen")){
    
                    response.text().then((value) => {
                        console.log("SEEN result found: " + value);
                    })		
                }
                
            });

            console.log("vai: " + new Date());
        
            console.log("0-1-zap-open | entrando no IG...");
            await page.goto(`https://www.instagram.com/accounts/login/`, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
    
            await page.waitForSelector('input[name="username"]');
    
            //await page.type('input[name="username"]', "tpatriciogamer");
            //await page.type('input[name="password"]', "Ukx945395");
            await page.type('input[name="username"]', filter.user.name);
            await page.type('input[name="password"]', filter.user.password);
            await page.click('button[type="submit"]');

            await page.waitFor(10000);

            ////await page.screenshot({path: 'abb1.png'});

            console.log(page.url());
            if(page.url().match("challenge")){
                
                await page.click('span.idhGk button');
                console.log("pega o codigo em 40 segundos");
                await page.waitFor(40000);
                console.log("foi!");

                var code_data = require('./challenge.json');
                var code = code_data.code;
                console.log("aguarda o 5 segundos, code: " + code);
                await page.waitFor(5000);
                ////await page.screenshot({path: 'aGL1.png'});

                await page.type('input._281Ls', code);
                await page.click('span.idhGk button');

                console.log("aguarda o 5 segundos, enviou");
                await page.waitFor(5000);
                ////await page.screenshot({path: 'aGL2.png'});
            }
            
            //var arr_locales = result;
            //var arr_locales_index = 10;
            var count_exit = 0;
            var exit_while = false;
            while(exit_while == false){
                count_exit++;
                if(count_exit != 3){

                    if(m_locales.length > 0){

                        try{

                            /*
                            await page.goto(`https://www.instagram.com/`, {
                                waitUntil: 'networkidle2',
                                timeout: 3000000
                            });*/

                            await page.waitFor(3000);
                            console.log("seguranca espera 3 segundos");

                            var location_main = m_locales[0];
                            console.log("GO RESTAM " + m_locales.length);

                            var url_profile = "https://www.instagram.com/explore/locations/" + location_main.id;
                            //var url_profile = location_main.origin_url;
                            //console.log("LOCATION NAME: " + location_main.name);
                            if(location_main.name && location_main.name.length > 0){
                                console.log("LOCATION NAME: " + location_main.name);
                            }
                            console.log("LOCATION ID: " + location_main.id);
                            console.log("LOCATION URL: " + url_profile);
                            console.log("LOCATION DISTRICT: " + location_main.district_id);
                            await page.goto(url_profile, {
                                waitUntil: 'networkidle2',
                                timeout: 3000000
                            });

                            console.log("ENTROU NOS STORIES");

                            var have_stories = true;
                            try{
                                await page.waitForSelector('div.D1yaK', {
                                    timeout: 5000
                                });
                            }catch(err){
                                have_stories = false;
                            }

                            if(have_stories){

                                await page.waitForSelector('div.D1yaK', {
                                    timeout: 5000
                                });
                                await page.click('div.D1yaK');      
                                
                                //div.VU4al

                                var stories_count = 0;
                                await page.waitForSelector('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]', {
                                    timeout: 8000
                                });

                                ////await page.screenshot({path: 'abb2.png'});
                        
                                stories_count = await page.evaluate(() => {
                                    return document.querySelectorAll('div[class="w9Vr- _6ZEdQ"] div[class="_7zQEa"]').length;
                                });
                                
                                //console.log("Temos de stories REAL: " + location_main.count);
                                console.log("Temos de stories VIEW: " + stories_count);
                                console.log("Temos de stories MAIN: " + stores_main.length);

                                //checkStories(location_main.id, stores_main);
                                //console.log("\n\naguarda CHECAGEM...");
                                //await page.waitFor(10000);

                                console.log("xau xau: " + new Date());

                                for (let index = 0; index < stories_count; index++) {

                                    var stories_data = JSON.parse(JSON.stringify(stores_main[index]));
                                    stories_data.district_id = location_main.district_id;
                                    stories_data.is_more = true;
                                    createPost(stories_data);
                                    //prev button.B-R4p

                                    await page.waitFor(1000);
            
                                    await page.waitForSelector('button.ow3u_', {
                                        timeout: 15000
                                    });
                                    await page.click('button.ow3u_');

                                    console.log("oi " + index);
                                }
                                
                                console.log("Vamos p/ prox rodada...");
                                //await page.waitFor(10000);

                            }else{
                                console.log("NÃO TEM STORIES!********");
                                console.log("Vamos p/ prox LOCAL...");
                                count_exit = 0;
                                m_locales.splice(0, 1);
                            }

                        }catch(err){
                            console.log("err: " + err);
                            console.log("Vamos p/ prox LOCAL em 5 segundos...");
                            count_exit = 0;
                            m_locales.splice(0, 1);
                            await page.waitFor(5000);
                        }

                    }else{
                        m_locales_status = false;
                        exit_while = true;
                    }

                }else{
                    console.log("Exit: quarta rodada seguida do mesmo local");
                    console.log("Vamos p/ prox LOCAL em 5 segundos...");
                    count_exit = 0;
                    m_locales.splice(0, 1);
                }

            }
    
            browser.close();
            //getStories(filter);
            return true;
        };
    
        scrape().then((value) => {
            console.log("stopei localeGetPosts");
            igLocalPosts(filter);
        })   
	
    } 
    
    function igLocalPosts(filter){

        let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
		app.set('sequelize', sequelize);
		sequelize.authenticate();

		var dd = moment(new Date()).add(3, 'hours').subtract(30, 'minutes').format("YYYY-MM-DD HH:mm:ss") + "+00";

        var where_stament = "pos.taken_date >= '" + dd + "'";
        
        if(filter.locales[0].district_id == 2){

            var exclude_aux = JSON.stringify(exclude_ids_sp_host);
            exclude_aux = exclude_aux.replace("[", "(").replace("]", ")");

            where_stament += " AND loc.id NOT IN " + exclude_aux;
            
        }else if(filter.locales[0].district_id == 3){

            var exclude_aux = JSON.stringify(exclude_ids_rec_host);
            exclude_aux = exclude_aux.replace("[", "(").replace("]", ")");

            where_stament += " AND loc.id NOT IN " + exclude_aux;
        }

		var query =
		"SELECT loc.name, loc.origin_id as id, " + filter.locales[0].district_id + " as district_id " +
		"FROM locales loc " +
		"INNER JOIN posts pos on loc.id = pos.local_id " + 
		"INNER JOIN adresses ads on loc.address_id = ads.id " + 
		"INNER JOIN districts dis on ads.district_id = dis.id " + 
		"WHERE pos.is_video = true AND ads.district_id = " + filter.locales[0].district_id + " AND " + where_stament + " " +
		"GROUP BY loc.id, pos.local_id, dis.id " + 
		"ORDER BY count(pos.local_id) DESC";
		
		sequelize.query(query).spread((result, metadata) => {
            //console.log(result.length);

            m_locales = JSON.parse(JSON.stringify(result));
            if(m_locales_status == false){
                m_locales_status = true;
                localeGetPosts(filter);
            }
        });
        
    }

    function startLocalesAutoUpdate(locales){

        let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
		app.set('sequelize', sequelize);
        sequelize.authenticate();

        var district_ids = locales.map(function(l) {
            return l.district_id;
        });
        district_ids = JSON.stringify(district_ids).replace("[", "(").replace("]", ")");

        var dd_current = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        
        var query =
        "SELECT loca.id, loca.name, origin_url " +
        "FROM posts post " +
        "INNER JOIN locales loca on post.local_id = loca.id " + 
        "INNER JOIN adresses ads on loca.address_id = ads.id " + 
        "WHERE ads.district_id IN " + district_ids + " AND (loca.photos_updated_at <= '" + dd_current + "' OR loca.photos_updated_at is null) " +
        "GROUP BY post.id, post.local_id, loca.id " + 
        "ORDER BY post.id DESC " + 
        "LIMIT 1";	
		
		sequelize.query(query).spread((result, metadata) => {
            
            var local_main = result[0];
			console.log("\n\nAuto Update: " + local_main.id +  "| " +  local_main.name );

            const puppeteer = require('puppeteer')

            let scrape = async () => {
                const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                var page = await browser.newPage()
                const override = Object.assign(page.viewport(), {width: 1366});
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
                await page.setViewport(override);
        
                console.log("vai NOVO NOVO: " + new Date());
                console.log("0-1-zap-open | entrando no IG...");

                try{
                    await page.goto(local_main.origin_url, {
                        waitUntil: 'networkidle2',
                        timeout: 5000
                    });
                }catch(err){
                    console.log("ERRO OPEN");
                    //await page.screenshot({path: 'err-new-' + localData[0].id + '.png'});    
                }

                try{
                    await page.waitForSelector('img.FFVAD', {
                        timeout: 5000
                    });
                }catch(err){
                    console.log("em new LOCAL, NADA DE IMAGENS");
                    //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                }

                try{
                    await page.waitForSelector('meta[property="place:location:latitude"]', {
                        timeout: 5000
                    });
                }catch(err){
                    console.log("nada nada de latitude");
                    //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                }

                const local_info = await page.evaluate(() => {

                    var local = {};
                    /*
                    var lat_long = {};
                    if(document.querySelector('meta[property="place:location:latitude"]')){
                        lat_long.lat = parseFloat(document.querySelector('meta[property="place:location:latitude"]').getAttribute("content"));
                        lat_long.long = parseFloat(document.querySelector('meta[property="place:location:longitude"]').getAttribute("content"));

                        local.lat_long = lat_long;
                    }

                    if(document.querySelector('div.o0Sr9 h1')){
                        local.name = document.querySelector('div.o0Sr9 h1').innerText;
                        if(local.name.match("Photos and Videos of ")){
                            local.name = local.name.replace("Photos and Videos of ", "");
                        }
                    }*/

                    if(document.querySelector('img.FFVAD')){
                        local.origin_picture_url = document.querySelector('img.FFVAD').getAttribute("src");

                        var photos = [];
                        var arr = document.querySelectorAll('img.FFVAD');
                        for (let index = arr.length - 1; index >= 0; index--) {
                            var p = arr[index];
                            photos.push(p.src);
                        }

                        local.photos = photos;

                    }
    
                    if(JSON.stringify(local) === '{}'){
                        local = null;
                    }

                    return local;
                });
                
                browser.close();
                return local_info;
            };
        
            scrape().then((local_update) => {

                var changes = {photos_updated_at: moment(new Date()).add(1, "hours").toDate()};

                if(local_update){

                    if(local_update.photos && local_update.photos.length > 0){
                        changes.photos = local_update.photos;
                    }

                    if(local_update.origin_picture_url && local_update.origin_picture_url.length > 0){
                        changes.origin_picture_url = local_update.origin_picture_url;
                    }
                }

                Local.update(changes, {
                    where: {
                        id: local_main.id
                    }
                }).then(updatePost => {
                    startLocalesAutoUpdate(locales);
                });

            })

        })      
    }

    function createPostBk(stories){

        try{

            var local = {};
            var local_info = stories.tappable_objects;
            for (let index = 0; index < local_info.length; index++) {
                var e = local_info[index];
                if(e.__typename.match("GraphTappableLocation")){
                    local.origin_id = e.id;
                    local.origin_url = "https://www.instagram.com/explore/locations/" + e.id;
                    break;
                }
            }

            var profile = {};
            profile.origin_id = stories.owner.id;
            profile.origin_username = stories.owner.username;
            profile.origin_pic_url = stories.owner.profile_pic_url;

            var post = {};
            post.origin_id = stories.id;
            post.is_video = stories.is_video;
            post.expired_date = new Date( moment(new Date(stories.expiring_at_timestamp * 1000)) );//.subtract(3, 'hours') );
            post.taken_date = new Date( moment(new Date(stories.taken_at_timestamp * 1000)) );//.subtract(3, 'hours') );
            if(stories.is_video){
                if(stories.video_resources[1]){
                    post.url = stories.video_resources[1].src;
                }else{
                    post.url = stories.video_resources[0].src;
                }
            }
            post.display_url = stories.display_url;
            post.data = JSON.parse(JSON.stringify(stories));

            post.local = local;
            post.profile = profile;
    
            async.auto({
                post_exist: function(done) {

                    Post.findOne({
                        where:{
                            origin_id: post.origin_id
                        }
                    }).then(postExistData => {	

                        if(postExistData){
                            done(null, true);
                        }else{
                            done(null, false);
                        }
                    });
                },
                local: ['post_exist', function(results, done) {

                    if(results.post_exist){
                        done(null, null);	
                    }else{
                        Local.findOrCreate({
                            where: {
                                origin_id: post.local.origin_id
                            },
                            defaults: post.local
                        }).then(localData => {	

                            if(localData[1]){
                                done(null, localData[0]);
                                //NOVO
                                const puppeteer = require('puppeteer')

                                let scrape = async () => {
                                    const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                                    var page = await browser.newPage()
                                    const override = Object.assign(page.viewport(), {width: 1366});
                                    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
                                    await page.setViewport(override);
                            
                                    console.log("vai NOVO NOVO: " + new Date());
                                    
                                    console.log("0-1-zap-open | entrando no IG...");
                                    try{
                                        await page.goto(localData[0].origin_url, {
                                            waitUntil: 'networkidle2',
                                            timeout: 15000
                                        });
                                    }catch(err){
                                        console.log("ERRO OPEN");
                                        //await page.screenshot({path: 'err-new-' + localData[0].id + '.png'});    
                                    }

                                    //await page.screenshot({path: 'bb-screenshot1.png'});

                                    try{
                                        await page.waitForSelector('img.FFVAD', {
                                            timeout: 15000
                                        });
                                    }catch(err){
                                        console.log("em new LOCAL, NADA DE IMAGENS");
                                        //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                                    }

                                    try{
                                        await page.waitForSelector('meta[property="place:location:latitude"]', {
                                            timeout: 15000
                                        });
                                    }catch(err){
                                        console.log("nada nada de latitude");
                                        //await page.screenshot({path: 'err-new-photos-' + localData[0].id + '.png'});    
                                    }

                                    const local_info = await page.evaluate(() => {

                                        var local = {};

                                        var lat_long = {};
                                        if(document.querySelector('meta[property="place:location:latitude"]')){
                                            lat_long.lat = parseFloat(document.querySelector('meta[property="place:location:latitude"]').getAttribute("content"));
                                            lat_long.long = parseFloat(document.querySelector('meta[property="place:location:longitude"]').getAttribute("content"));

                                            local.lat_long = lat_long;
                                        }

                                        if(document.querySelector('div.o0Sr9 h1')){
                                            local.name = document.querySelector('div.o0Sr9 h1').innerText;
                                            if(local.name.match("Photos and Videos of ")){
                                                local.name = local.name.replace("Photos and Videos of ", "");
                                            }
                                        }

                                        if(document.querySelector('img.FFVAD')){
                                            local.pic_url = document.querySelector('img.FFVAD').getAttribute("src");

                                            var photos = [];
                                            var arr = document.querySelectorAll('img.FFVAD');
                                            for (let index = arr.length - 1; index >= 0; index--) {
                                                var p = arr[index];
                                                photos.push(p.src);
                                            }

                                            local.photos = photos;

                                        }
                        
                                        if(JSON.stringify(local) === '{}'){
                                            local.empty = true;
                                        }

                                        return local;

                                        /*
                                        var lat = parseFloat(document.querySelector('meta[property="place:location:latitude"').getAttribute("content"));
                                        var long = parseFloat(document.querySelector('meta[property="place:location:longitude"]').getAttribute("content"));

                                        var name = document.querySelector('div.o0Sr9 h1').innerText;
                                        var pic_url = null;
                                        try{
                                            pic_url = document.querySelector('img.FFVAD').getAttribute("src");
                                        }catch(err){
                                            console.log("get img error: " + err);
                                        }

                                        return {lat_long: {lat: lat, long: long}, name: name, pic_url: pic_url};
                                        */
                                    });

                                    /*
                                    await page.goto('https://developers.google.com/maps/documentation/javascript/examples/geocoding-reverse', {
                                        waitUntil: 'networkidle2',
                                        timeout: 5000
                                    });

                                    await page.waitFor(3000);

                                    await page.waitForSelector('input#latlng');
                                    await page.type('input#latlng', local_info.lat_long.lat + ',' + local_info.lat_long.long);
                                    await page.click('input#submit');

                                    //await page.screenshot({path: 'bb-screenshot1.png'});
            
                                    await page.waitForSelector('div.gm-style-iw-d div');
                                    const full_address = await page.evaluate(() => {
                                        return document.querySelector('div.gm-style-iw-d div').innerText;
                                    });

                                    await page.waitFor(3000);

                                    local_info.full_address = full_address;*/
                                    
                                    browser.close();
                                    return local_info;
                                };
                            
                                scrape().then((local_result) => {

                                    Address.create({
                                        //line: local_result.full_address,
                                        lat: local_result.lat_long.lat,
                                        long: local_result.lat_long.long,
                                        district_id: stories.district_id
                                    }).then(addressCreate => {	

                                        var changes = {address_id: addressCreate.id, name: local_result.name, origin_picture_url: local_result.pic_url};
                                        if(local_result.photos && local_result.photos > 0){
                                            changes.photos = local_result.photos;
                                        }

                                        Local.update(changes, {
                                            where: {
                                                id: localData[0].id
                                            }
                                        }).then(updatePost => {
                                        });

                                        Local.update(changes, {
                                            where: {
                                                id: localData[0].id
                                            }
                                        }).then(updatePost => {
                                        });

                                        //updateGoogleDataLocal(localData[0].id);
                                        
                                    });
                                }) 
                                
                            }else{
                                //JÁ EXISTE
                                done(null, localData[0]);

                                const puppeteer = require('puppeteer')

                                let scrape = async () => {
                                    const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                                    var page = await browser.newPage()
                                    const override = Object.assign(page.viewport(), {width: 1366});
                                    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
                                    await page.setViewport(override);
                            
                                    console.log("vai JA EXISITE: " + new Date());
                                    
                                    console.log("0-1-zap-open | entrando no IG...");
                                    try{
                                        await page.goto(localData[0].origin_url, {
                                            waitUntil: 'networkidle2',
                                            timeout: 15000
                                        });

                                    }catch(err){
                                        console.log("ERRO OPEN");
                                        //await page.screenshot({path: 'err-curr-' + localData[0].id + '.png'});    
                                    }

                                    //await page.screenshot({path: 'bb-screenshot1.png'});

                                    try{
                                        await page.waitForSelector('img.FFVAD', {
                                            timeout: 15000
                                        });
                                    }catch(err){
                                        console.log("em new LOCAL, NADA DE IMAGENS");
                                        //await page.screenshot({path: 'err-curr-photos-' + localData[0].id + '.png'});  
                                    }
                                    /*
                                    const local_info = await page.evaluate(() => {
                                        var name = null; 
                                        var selection_name = document.querySelector('div.o0Sr9 h1') !== null;
                                        if(selection_name){
                                            try{
                                                name = document.querySelector('div.o0Sr9 h1').innerText;
                                            }catch(err){
                                                name = null; 
                                                console.log("err get name: " + err);
                                            }
                                        }else{
                                            console.log("err get name NOT EXIST");
                                        }

                                        var pic_url = null; 
                                        var selection_pic_url = document.querySelector('img.FFVAD') !== null;
                                        if(selection_pic_url){
                                            try{
                                                pic_url = document.querySelector('img.FFVAD').getAttribute("src");
                                            }catch(err){
                                                pic_url = null; 
                                                console.log("err get pic_url: " + err);
                                            }
                                        }else{
                                            console.log("err get pic_url NOT EXIST");
                                        }

                                        //return {lat_long: {lat: lat, long: long}, name: name, pic_url: pic_url};
                                        return { name: name, origin_picture_url: pic_url};
                                    });*/

                                    const local_info = await page.evaluate(() => {

                                        var local = {};

                                        if(document.querySelector('div.o0Sr9 h1')){
                                            local.name = document.querySelector('div.o0Sr9 h1').innerText;
                                        }

                                        if(document.querySelector('img.FFVAD')){
                                            local.origin_picture_url = document.querySelector('img.FFVAD').getAttribute("src");

                                            var photos = [];
                                            var arr = document.querySelectorAll('img.FFVAD');
                                            for (let index = arr.length - 1; index >= 0; index--) {
                                                var p = arr[index];
                                                photos.push(p.src);
                                            }

                                            local.photos = photos;

                                        }
                        
                                        if(JSON.stringify(local) === '{}'){
                                            local.empty = true;
                                        }

                                        return local;
                                    });
                                    
                                    browser.close();
                                    return local_info;
                                };
                            
                                scrape().then((local_result) => {

                                    if(localData[0].name && localData[0].name.length > 0){
                                        console.log("updated: " + localData[0].name);

                                        if(localData[0].name.match("Photos and Videos of ")){
                                            local_result.name = localData[0].name.replace("Photos and Videos of ", "");
                                        }else{
                                            delete local_result.name;
                                        }

                                        
                                    }else{
                                        console.log("updated!!!!");
                                    }

                                    //console.log("UPPPPP: " + JSON.stringify(local_result));

                                    Local.update(local_result, {
                                        where: {
                                            id: localData[0].id
                                        }
                                    }).then(updatePost => {
                                    });

                                    //updateGoogleDataLocal(localData[0].id);

                                    /*
                                    if(local_result.origin_picture_url && local_result.origin_picture_url.length > 0){

                                        Local.update(local_result, {
                                            where: {
                                                id: localData[0].id
                                            }
                                        }).then(updatePost => {
                                        });

                                    }*/
                                    
                                }) 
                            }
                        });
                    }
                }],
                profile: ['post_exist', function(results, done) {

                    if(results.post_exist){
                        done(null, null);	
                    }else{
                        Profile.findOrCreate({
                            where: {
                                origin_id: post.profile.origin_id
                            },
                            defaults: post.profile
                        }).then(profileData => {	

                            done(null, profileData[0]);	

                        });	
                    }
                }],
            }, function(err, results) {
                if(err) {
                    console.log("ERRR: " + err);
                    reject(err);
                    return;
                }

                if(results.post_exist){
                    console.log("\n\npost exist: " + post.origin_id);
                }else{

                    delete post.local;
                    post.local_id = results.local.id;
                    delete post.profile;
                    post.profile_id = results.profile.id;

                    Post.create(
                        post
                    ).then(profileDataNewCreate => {	

                        console.log("\n\npost CRIADO CRIADO: " + post.origin_id);

                    });	

                }
            
            });

        }catch(err){
            console.log("Error createPost: " + err);
        }

    }

    function igLocales(filter){

        Local.findAll({
            where: {
                origin_picture_url: null
            }
        }).then(locales => {

            const puppeteer = require('puppeteer')

            let scrape = async () => {
                const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                var page = await browser.newPage()
                const override = Object.assign(page.viewport(), {width: 1366});
                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
                await page.setViewport(override);
        
                for (let index = 0; index < locales.length; index++) {

                    var l = locales[index];

                    console.log(index + " de " + locales.length);
                    console.log("ID: " + l.id);
                    console.log("GO: " + l.origin_url);

                    if(l.origin_url && l.origin_url.length > 0){

                        await page.goto(l.origin_url, {
                            waitUntil: 'load',
                            timeout: 3000000
                        });

                        try{

                            await page.waitForSelector('div.o0Sr9 h1');

                            const local_info = await page.evaluate(() => {
                                /*
                                var lat = null; 
                                var selection_lat = document.querySelector('meta[property="place:location:latitude"') !== null;
                                if(selection_lat){
                                    try{
                                        lat = parseFloat(document.querySelector('meta[property="place:location:latitude"').getAttribute("content"));
                                    }catch(err){
                                        lat = null; 
                                        console.log("err get lat: " + err);
                                    }
                                }else{
                                    console.log("err get lat NOT EXIST");
                                }

                                var long = null; 
                                var selection_long= document.querySelector('meta[property="place:location:longitude"]') !== null;
                                if(selection_long){
                                    try{
                                        long = parseFloat(document.querySelector('meta[property="place:location:longitude"]').getAttribute("content"));
                                    }catch(err){
                                        long = null; 
                                        console.log("err get long: " + err);
                                    }
                                }else{
                                    console.log("err get LONG NOT EXIST");
                                }*/

                                var name = null; 
                                var selection_name = document.querySelector('div.o0Sr9 h1') !== null;
                                if(selection_name){
                                    try{
                                        name = document.querySelector('div.o0Sr9 h1').innerText;
                                    }catch(err){
                                        name = null; 
                                        console.log("err get name: " + err);
                                    }
                                }else{
                                    console.log("err get name NOT EXIST");
                                }
                                
                                //img.ECCnW
                                //img.FFVAD
                                var pic_url = null; 
                                var selection_pic_url = document.querySelector('img.ECCnW') !== null;
                                if(selection_pic_url){
                                    try{
                                        pic_url = document.querySelector('img.ECCnW').getAttribute("src");
                                    }catch(err){
                                        pic_url = null; 
                                        console.log("err get pic_url: " + err);
                                    }
                                }else{
                                    console.log("err get pic_url NOT EXIST");
                                }

                                //return {lat_long: {lat: lat, long: long}, name: name, pic_url: pic_url};
                                return { name: name, origin_picture_url: pic_url};
                            });

                            console.log("\n\n" + l.name);
                            console.log(local_info);

                            updateLocal(l.id, local_info);

                        }catch(err){
                            console.log("\n\n" + l.name);
                            console.log("err get: " + err);

                            console.log("espera 10 segundos pra evitar erros... relaxe!");
                            await page.waitFor(10000);

                        }

                    }else{
                        console.log("\n\n" + l.name);
                        console.log("NULO NULO NULO");
                    }
                }

                browser.close();
                //getStories(filter);
                return true;
            };
        
            scrape().then((value) => {
                console.log(value)
            })  

        });
    }

    function updateLocal(id, changes){
        Local.update(changes, {
            where: {
                id: id
            }
        }).then(updatePost => {
        });
    }
    
    function getLocalesA(filter){
		return new Promise((resolve, reject) => {			

            console.log("SAPECAAAA AAA: " + new Date());

            var dd = moment(new Date()).subtract(parseInt(filter.range_minutes), 'minutes').format("YYYY-MM-DD HH:mm:ss") + "+00";
            //var dd = moment(new Date()).subtract(parseInt(filter.range_minutes), 'minutes').format("YYYY-MM-DD HH:mm:ss") + "+00";
            var dd_v = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";

            var whereStamentAddress = {};
            if(filter.city_id){
                whereStamentAddress.district_id = filter.city_id;
            }

            var whereStamentLocal = {
                address_id: {
                    not: null
                }
            };
            if(filter.exclude){
                var ex = {notIn: filter.exclude};
                whereStamentLocal.id = ex;
            }   

            /*
            attributes: Object.keys(Customer.attributes).concat([
                [sequelize.literal('(SELECT SUM("Orders"."amount") FROM "Orders" WHERE "Orders"."CustomerId" = "Customer"."id")'), 'totalAmount']
            ])*/

            if(!filter.category_id){

                Local.findAll({
                    attributes: [
                        'id', 
                        'name', 
                        'origin_picture_url', 
                        'google_data_scrape',
                        [Sequelize.fn("COUNT", Sequelize.col("post.local_id")), "count"]
                    ],
                    where: whereStamentLocal,
                    include: [
                        {
                            model: Address,
                            as: "address",
                            attributes: ['district_id', 'line'],
                            where: whereStamentAddress,
                            include: [
                                {
                                    model: District,
                                    as: "district",
                                    attributes: ['name']
                                }
                            ]
                        },
                        {
                            model: Post,
                            as: "post",
                            attributes: [],
                            where: {
                                taken_date: {
                                    gte: dd
                                },
                                is_video: true,
                            },
                            duplicating: false
                        }
                    ],
                    group: ['locales.id', 'address.id', 'address.district.id'],
                    limit: 15,
                    order: [
                        ["count", "DESC"]
                    ]
                }).then(locales => {	
                    console.log("CHAPULETEI: " + new Date());
                    resolve(locales);
                    console.log("i: " + JSON.stringify(locales[0]));
        
                }).catch(function (err) {
                    // handle error;
                    console.log("ERROR: " + err);
                 });    
            
            
            }else{

                filter.category_id = parseInt(filter.category_id);

                Category.findAll({
                    attributes: ['categories'],
                    where:{
                        id: {
                            in: [filter.category_id]
                        }
                    }
                }).then(categories => {

                    var categories_ss = "";
                    categories.forEach(c => {
                        if(categories_ss.length > 0){
                            categories_ss += ",";
                        }
                        categories_ss += c.categories;
                    });

                    categories_ss = categories_ss.replace(new RegExp("[']","gi"), '"');
                    categories_ss = JSON.parse("[" + categories_ss + "]");

                    whereStamentLocal = {
                        "google_data_scrape":{
                            not: null
                        },
                        "google_data_scrape.category":{
                            $iLike: {
                                $any: categories_ss
                            }
                        },
                        address_id: {
                            not: null
                        }
                    };

                    if(filter.exclude){
                        var ex = {notIn: filter.exclude};
                        whereStamentLocal.id = ex;
                    }

                    Local.findAll({
                        attributes: [
                            'id', 
                            'name', 
                            'origin_picture_url', 
                            'google_data_scrape',
                            [Sequelize.fn("COUNT", Sequelize.col("post.id")), "count"]
                        ],
                        where: whereStamentLocal,
                        include: [
                            {
                                model: Address,
                                as: "address",
                                attributes: ['district_id'],
                                where: whereStamentAddress,
                                include: [
                                    {
                                        model: District,
                                        as: "district",
                                        attributes: ['name']
                                    }
                                ]
                            },
                            {
                                model: Post,
                                as: "post",
                                attributes: [],
                                where: {
                                    taken_date: {
                                        gte: dd
                                    },
                                    is_video: true,
                                },
                                duplicating: false
                            }
                        ],
                        group: ['locales.id', 'address.id', 'address.district.id'],
                        limit: 15,
                        order: [
                            ["count", "DESC"]
                        ]
                    }).then(locales => {	
                        console.log("CHAPULETEI: " + new Date());
                        resolve(locales);
                        console.log("i: " + JSON.stringify(locales[0]));
            
                    }); 
                })
            }
        })
    }

    function getLocales(filter){
		return new Promise((resolve, reject) => {			

            console.log("SAPECAAAA: " + new Date());
            
            var where_stament = "pos.is_video = true";

            if(filter.city_id){
                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament = "ads.district_id = " + filter.city_id;
            }

            var dd = moment(new Date()).subtract(parseInt(filter.range_minutes), 'minutes').format("YYYY-MM-DD HH:mm:ss") + "+00";
            var dd_v = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";

            if(filter.exclude){
                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament += "loc.id NOT IN " + filter.exclude;
            }
            
            if(!filter.category_id){

                console.log("SEM CATEGORY");
                var query_subtype =
                "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as countito, count(postito.local_id) as count, " +
                "loc.google_data_scrape, " +
                "ads.line " +
                "FROM locales loc " +
                "FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd_v + "'" + 
                "FULL JOIN posts postito on pos.id = postito.id and postito.taken_date >= '" + dd + "' " + 
                "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                "INNER JOIN districts dis on ads.district_id = dis.id " + 
                "WHERE " + where_stament + " " +
                "GROUP BY loc.id, dis.id, ads.line " + 
                "ORDER BY count DESC, countito DESC " +
                "LIMIT 15";
                /*
                query_subtype =
                "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.id) as count, " +
                "loc.google_data_scrape, " +
                "ads.line " +
                "FROM locales loc " +
                "FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "'" +
                "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                "INNER JOIN districts dis on ads.district_id = dis.id " + 
                "WHERE " + where_stament + " " +
                "GROUP BY loc.id, dis.id, ads.line " + 
                "ORDER BY count DESC " +
                "LIMIT 15";*/

                if(filter.off){
                    query_subtype += " OFFSET " + filter.off;
                }

                Sequelizito.query(query_subtype).spread((result, metadata) => {
                    resolve(result);
                    //console.log("result item: " + JSON.stringify(result[0]));
                    console.log("result: " + result.length);

                    console.log("CHAPULETEI: " + new Date());

                }).catch(function (err) {
                    console.log("getLocales q ERR: " + err);
                });

            }else{
                filter.category_id = parseInt(filter.category_id);

                Category.findAll({
                    attributes: ['categories'],
                    where:{
                        id: {
                            in: [filter.category_id]
                        }
                    }
                }).then(categories => {	

                    var categories_ss = "";
                    categories.forEach(c => {
                        if(categories_ss.length > 0){
                            categories_ss += ",";
                        }
                        categories_ss += c.categories;
                    });

                    console.log("SOS: " + categories_ss);
                    
                    var query_subtype =
                    "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as countito, loc.google_data_scrape, ads.line, count(postito.local_id) as count " +
                    "FROM locales loc " +
                    //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "' " + 
                    "FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd_v + "'" + 
                    "FULL JOIN posts postito on pos.id = postito.id and pos.taken_date >= '" + dd + "' " +
                    "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                    "INNER JOIN districts dis on ads.district_id = dis.id " + 
                    //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                    "WHERE upper(google_data_scrape ->> 'category') LIKE ANY (array[" + categories_ss + "]) AND " + where_stament + " " +
                    "GROUP BY loc.id, pos.local_id, dis.id, ads.line " + 
                    "ORDER BY count DESC, countito DESC " +
                    "LIMIT 15";
                    /*
                    query_subtype =
                    "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.id) as count, " +
                    "loc.google_data_scrape, " +
                    "ads.line " +
                    "FROM locales loc " +
                    "FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "'" +
                    "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                    "INNER JOIN districts dis on ads.district_id = dis.id " + 
                    "WHERE upper(google_data_scrape ->> 'category') LIKE ANY (array[" + categories_ss + "]) AND " + where_stament + " " +
                    "GROUP BY loc.id, dis.id, ads.line " + 
                    "ORDER BY count DESC " +
                    "LIMIT 15";*/

                    if(filter.off){
                        query_subtype += " OFFSET " + filter.off;
                    }

                    //console.log("getLocales q: " + query_subtype);

                    Sequelizito.query(query_subtype).spread((result, metadata) => {
                        resolve(result);
                        console.log("result: " + result.length);

                        console.log("CHAPULETEI: " + new Date());

                    }).catch(function (err) {
                        console.log("getLocales q ERR: " + err);
                    });

                });
                
            }
        })
    }

    function getLocalesBk(filter){
		return new Promise((resolve, reject) => {			

            console.log("SAPECAAAA: " + new Date());

            let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();
            
            var where_stament = "pos.is_video = true";

            if(filter.city_id){
                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament = "ads.district_id = " + filter.city_id;
            }

            if(filter.date_start){
                
                var ds = moment(new Date(filter.date_start)).format("YYYY-MM-DD HH:mm:ss");
                var de = moment(new Date(filter.date_end)).format("YYYY-MM-DD HH:mm:ss");

                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament += "pos.taken_date >= '" + ds + "' AND pos.taken_date <= '" + de + "'"; 

                
                //dd = "2019-05-05 17:00:00";
                //var dda = "2019-05-06 05:00:00";
                //where_stament += "pos.taken_date >= '" + dd + "' AND pos.taken_date <= '" + dda + "'";
                

                var query_subtype =
                "SELECT loc.*, count(pos.local_id) " +
                "FROM locales loc " +
                "INNER JOIN posts pos on loc.id = pos.local_id " + 
                "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                "WHERE " + where_stament + " " +
                "GROUP BY loc.id, pos.local_id " + 
                "ORDER BY count(pos.local_id) DESC;" 
                //"LIMIT 10";	
                
                sequelize.query(query_subtype).spread((result, metadata) => {
                    //console.log(JSON.stringify(result));

                    console.log("OI");

                    resolve(result);
                });

            }else{

                if(filter.range_minutes){

                    //var dd = moment(new Date()).subtract(3, "hours").subtract(parseInt(filter.range_minutes), 'minutes').format("YYYY-MM-DD HH:mm:ss");
                    var dd = moment(new Date()).subtract(parseInt(filter.range_minutes), 'minutes').format("YYYY-MM-DD HH:mm:ss") + "+00";
                    //var dd = moment(new Date()).subtract(180, 'minutes').format("YYYY-MM-DD HH:mm:ss") + "+00";

                    var dd_v = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                    //console.log("GO DATE: " + dd);

                    /*
                    if(where_stament.length > 0){
                        where_stament += " AND ";
                    }
                    where_stament += "pos.taken_date >= '" + dd + "'";*/
                    
                    //dd = "2019-05-25 12:10:00";
                    //var dda = "2019-05-26 08:00:00";
                    //where_stament += "pos.taken_date >= '" + dd + "' AND pos.taken_date <= '" + dda + "'";

                    if(filter.exclude){
                        if(where_stament.length > 0){
                            where_stament += " AND ";
                        }
                        where_stament += "loc.id NOT IN " + filter.exclude;
                    }
                    
                    if(!filter.category_id){

                        console.log("SEM CATEGORY");
                        var query_subtype =
                        "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as countito, count(postito.id) as count, " +
                        "loc.google_data_scrape, " +
                        //"loc.google_data_scrape ->> 'category' as category, " + 
                        //"loc.google_data_scrape ->> 'category_en' as category_en, " +
                        //"loc.google_data_scrape ->> 'address' as address, " +
                        //"loc.google_data_scrape ->> 'rating_value' as rating_value, " +
                        //"loc.google_data_scrape ->> 'rating_comments' as rating_comments, " +
                        //"loc.google_data_scrape ->> 'map_embed' as map_embed, " +
                        "ads.line " +
                        "FROM locales loc " +
                        //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "' " + 
                        "FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd_v + "'" + 
                        "FULL JOIN posts postito on pos.id = postito.id and pos.taken_date >= '" + dd + "' " + 
                        "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                        "INNER JOIN districts dis on ads.district_id = dis.id " + 
                        //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                        //"WHERE pos.taken_date >= '" + dd + "' AND " + where_stament + " " +
                        "WHERE " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id, dis.id, ads.line " + 
                        "ORDER BY count DESC, countito DESC " +
                        "LIMIT 15";


                        query_subtype =
                        "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as count, " +
                        "loc.google_data_scrape, " +
                        "ads.line " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "' " +
                        "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                        "INNER JOIN districts dis on ads.district_id = dis.id " + 
                        "WHERE " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id, dis.id, ads.line " + 
                        "ORDER BY count DESC " +
                        "LIMIT 15";

                        /*
                        var query_subtype =
                        "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as count, " +
                        "loc.google_data_scrape ->> 'category' as category, " + 
                        "loc.google_data_scrape ->> 'category_en' as category_en, " +
                        "loc.google_data_scrape ->> 'address' as address, " +
                        "loc.google_data_scrape ->> 'rating_value' as rating_value, " +
                        "loc.google_data_scrape ->> 'rating_comments' as rating_comments, " +
                        "loc.google_data_scrape ->> 'map_embed' as map_embed, " +
                        "ads.line " +
                        "FROM locales loc " +
                        "FULL JOIN posts pos on loc.id = pos.local_id " + 
                        //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "' " + 
                        //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd_v + "'" + 
                        //"FULL JOIN posts postito on pos.id = postito.id and pos.taken_date >= '" + dd + "' " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "INNER JOIN districts dis on ads.district_id = dis.id " + 
                        //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                        "WHERE pos.taken_date >= '" + dd + "' AND " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id, dis.id, ads.line " + 
                        "ORDER BY count DESC " +
                        "LIMIT 15";*/

                        //console.log(query_subtype);

                        /*
                        var query_subtype =
                        "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(case pos.taken_date >= '" + dd + "' when true then 1 else null end) as count " +
                        "FROM locales loc " +
                        "FULL JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "INNER JOIN districts dis on ads.district_id = dis.id " + 
                        //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                        "WHERE " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id, dis.id " + 
                        "ORDER BY count DESC " +
                        "LIMIT 30";*/
    
                        if(filter.off){
                            query_subtype += " OFFSET " + filter.off;
                        }
    
                        //console.log("getLocales q: " + query_subtype);

                        if(filter.t == 1){
                            console.log("TYPE 1");
                            sequelize.query(query_subtype).spread((result, metadata) => {
                                resolve(result);
                                console.log("result item: " + JSON.stringify(result[0]));
                                console.log("result: " + result.length);
        
                                console.log("CHAPULETEI: " + new Date());
        
                            }).catch(function (err) {
                                console.log("getLocales q ERR: " + err);
                            });
                        }else if(filter.t == 2){
                            console.log("TYPE 2");
                            t2(resolve);
                        }else if(filter.t == 3){
                            console.log("TYPE 3");
                            query_subtype =
                            "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as count, " +
                            "loc.google_data_scrape, " +
                            //"loc.google_data_scrape ->> 'category' as category, " + 
                            //"loc.google_data_scrape ->> 'category_en' as category_en, " +
                            //"loc.google_data_scrape ->> 'address' as address, " +
                            //"loc.google_data_scrape ->> 'rating_value' as rating_value, " +
                            //"loc.google_data_scrape ->> 'rating_comments' as rating_comments, " +
                            //"loc.google_data_scrape ->> 'map_embed' as map_embed, " +
                            "ads.line " +
                            "FROM locales loc " +
                            "FULL JOIN posts pos on loc.id = pos.local_id " + 
                            //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "' " + 
                            //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd_v + "'" + 
                            //"FULL JOIN posts postito on pos.id = postito.id and pos.taken_date >= '" + dd + "' " + 
                            "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                            "INNER JOIN districts dis on ads.district_id = dis.id " + 
                            //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                            //"WHERE pos.taken_date >= '" + dd + "' AND " + where_stament + " " +
                            "WHERE " + where_stament + " " +
                            "GROUP BY loc.id, pos.local_id, dis.id, ads.line " + 
                            "ORDER BY count DESC " +
                            "LIMIT 15";
                            sequelize.query(query_subtype).spread((result, metadata) => {
                                resolve(result);
                                console.log("result item: " + JSON.stringify(result[0]));
                                console.log("result: " + result.length);
        
                                console.log("CHAPULETEI: " + new Date());
        
                            }).catch(function (err) {
                                console.log("getLocales q ERR: " + err);
                            });
                        }

                    }else{
                        filter.category_id = parseInt(filter.category_id);

                        Category.findAll({
                            attributes: ['categories'],
                            where:{
                                id: {
                                    in: [filter.category_id]
                                }
                            }
                        }).then(categories => {	
                            //var ss = "['RESTAURANTE','RESTAURANTE JAPONÊS','RESTAURANTE FAST-FOOD','RESTAURANTE ITALIANO','RESTAURANTE SELF-SERVICE','RESTAURANTE DE FRUTOS DO MAR','RESTAURANTE FRANCÊS','RESTAURANTE MEXICANO','RESTAURANTE NORTE-AMERICANO','RESTAURANTE DE SUSHI','RESTAURANTE MEDITERRÂNEO','RESTAURANTE CHINÊS','RESTAURANTE BRASILEIRO','RESTAURANTE VIETNAMITA','RESTAURANTE DE CAFÉ DA MANHÃ','RESTAURANTE DO ORIENTE MÉDIO','RESTAURANTE DE FRANGO','RESTAURANTE INDIANO','RESTAURANTE DE COMIDA NATURAL','RESTAURANTE VEGANO','RESTAURANTE TAILANDÊS','RESTAURANTE DE CARNE','RESTAURANTE ASIÁTICO','RESTAURANTE LIBANÊS','RESTAURANTE MINEIRO','RESTAURANTE COREANO','RESTAURANTE DE GASTRONOMIA MODERNA DOS EUA','RESTAURANTE ESPECIALIZADO EM RAMEN','RESTAURANTE VEGETARIANO','RESTAURANTE AUSTRALIANO','RESTAURANTE ARGENTINO','RESTAURANTE PERUANO','RESTAURANTE DE BRUNCH','RESTAURANTE PORTUGUÊS','RESTAURANTE CALIFORNIANO','RESTAURANTE ESPANHOL','RESTAURANTE GREGO','RESTAURANTE ALEMÃO','RESTAURANTE REFINADO','RESTAURANTE TURCO','RESTAURANTE FILIPINO','RESTAURANTE HAVAIANO','RESTAURANTE DE SOPAS','RESTAURANTE ORGÂNICO','RESTAURANTE DE GASTRONOMIA DE EL SALVADOR','RESTAURANTE DE COMIDA CASEIRA','RESTAURANTE LATINO-AMERICANO','RESTAURANTE PERSA','RESTAURANTE ESPECIALIZADO EM HOT POT','RESTAURANTE ESPECIALIZADO EM DIM SUM','RESTAURANTE DE GASTRONOMIA DE FUSÃO ASIÁTICA','RESTAURANTE ESPECIALIZADO EM TAPAS','RESTAURANTE DE CHURRASCO COREANO','RESTAURANTE ECLÉTICO','RESTAURANTE PAQUISTANÊS','RESTAURANTE MARROQUINO','RESTAURANTE AFRICANO','RESTAURANTE DE CHURRASQUINHO','RESTAURANTE FRANCÊS MODERNO','RESTAURANTE DE ALIMENTOS SEM GLÚTEN','RESTAURANTE ESPECIALIZADO EM CARNES','RESTAURANTE ESPECIALIZADO EM ASINHAS DE FRANGO','RESTAURANTE DE FONDUE','RESTAURANTE SÍRIO','RESTAURANTE DE TACO','RESTAURANTE ESPECIALIZADO EM SHABU-SHABU','RESTAURANTE DE COMIDA PARA VIAGEM','RESTAURANTE DE GASTRONOMIA TEX-MEX','RESTAURANTE DE SOUL FOOD','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DO SUL DOS EUA','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE SICHUAN','RESTAURANTE JAPONÊS ESPECIALIZADO EM CARNES','RESTAURANTE COLOMBIANO','RESTAURANTE RUSSO','RESTAURANTE E IZAKAYA','RESTAURANTE ETÍOPE','RESTAURANTE ESPECIALIZADO EM SUSHI SERVIDO EM ESTEIRA GIRATÓRIA','RESTAURANTE DE FALAFEL','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DE FUSÃO','RESTAURANTE ESPECIALIZADO EM FISH AND CHIPS','RESTAURANTE BIRMANÊS','RESTAURANTE ESPECIALIZADO EM SANDUÍCHES GIGANTES HOAGIES','BAR E RESTAURANTE DE OSTRAS','RESTAURANTE DE GASTRONOMIA TRADICIONAL DOS EUA','RESTAURANTE DE GASTRONOMIA DO TAIWAN','RESTAURANTE IEMENITA','RESTAURANTE ESPECIALIZADO EM DUMPLINGS','RESTAURANTE ESPECIALIZADO EM PHO','RESTAURANTE FAMILIAR','RESTAURANTE DE GASTRONOMIA CAJUN','RESTAURANTE EGÍPCIO','RESTAURANTE BASCO','RESTAURANTE DE GASTRONOMIA FRANCESA SOFISTICADA','RESTAURANTE DA ERITREIA','RESTAURANTE ESPECIALIZADO EM CUSCUZ','RESTAURANTE ESPECIALIZADO EM DOCES JAPONESES','RESTAURANTE ESPECIALIZADO EM CULINÁRIA HALAL','RESTAURANTE ISRAELITA','RESTAURANTE DE GASTRONOMIA DO AFEGANISTÃO','RESTAURANTE JAPONÊS AUTÊNTICO','RESTAURANTE POPULAR','RESTAURANTE CANTONÊS','RESTAURANTE CUBANO','RESTAURANTE BELGA','RESTAURANTE DE BURRITO','RESTAURANTE ESPECIALIZADO EM YAKISSOBA','RESTAURANTE ESPECIALIZADO EM SANDUÍCHES CHEESESTEAKS','RESTAURANTE TCHECO','RESTAURANTE CANADENSE','RESTAURANTE JAMAICANO','RESTAURANTE ESPECIALIZADO EM CARANGUEJOS','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE GALÍCIA','RESTAURANTE URUGUAIO','RESTAURANTE LAOSIANO','RESTAURANTE NEPALÊS','RESTAURANTE DE GASTRONOMIA LATINO-AMERICANA MODERNA','RESTAURANTE ESPECIALIZADO EM CHURRASCO MONGOL','RESTAURANTE JUDEU','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE HUNAN','RESTAURANTE VENEZUELANO','RESTAURANTE CONTINENTAL','RESTAURANTE ESPECIALIZADO EM UDON','RESTAURANTE ESCANDINAVO','RESTAURANTE ESPECIALIZADO EM COSTELETAS','RESTAURANTE PAN-ASIÁTICO','RESTAURANTE MALAIO','RESTAURANTE CARIBENHO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DO CAMBOJA','RESTAURANTE DE CARNES FRANCÊS','RESTAURANTE EUROPEU','RESTAURANTE INDONÉSIO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE CATALUNHA','RESTAURANTE ARMÊNIO','RESTAURANTE BRITÂNICO','RESTAURANTE ESPECIALIZADO EM YAKITORI','RESTAURANTE ESPECIALIZADO EM CURRY JAPONÊS','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA SUL-AMERICANA','RESTAURANTE DE GASTRONOMIA DO SRI LANKA','RESTAURANTE CASTELHANO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE ALSACE','RESTAURANTE AUSTRÍACO','RESTAURANTE ESPECIALIZADO EM SUKIYAKI E SHABU SHABU','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DO SUDOESTE DOS EUA','RESTAURANTE DE CULINÁRIA JAPONESA COM INFLUÊNCIA OCIDENTAL','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA NICARÁGUA','RESTAURANTE OU CAFÉ','RESTAURANTE MANDARIM','RESTAURANTE JAPONÊS ESPECIALIZADO EM LÍNGUA','RESTAURANTE HOLANDÊS','RESTAURANTE PORTO-RIQUENHO','RESTAURANTE ESPECIALIZADO EM CURRY INDIANO','RESTAURANTE DE COMIDA CRUA','RESTAURANTE DE GASTRONOMIA DE CABO VERDE','RESTAURANTE ÉTNICO','RESTAURANTE EQUATORIANO','RESTAURANTE CHILENO','RESTAURANTE DE GASTRONOMIA CRIOULA','RESTAURANTE INGLÊS','RESTAURANTE IRLANDÊS','RESTAURANTE DE GASTRONOMIA DO OESTE AFRICANO','RESTAURANTE KOSHER','RESTAURANTE HAITIANO','RESTAURANTE DE GASTRONOMIA DO NORTE DA ITÁLIA','RESTAURANTES COM DELIVERY','RESTAURANTE OCIDENTAL','RESTAURANTE EPECIALIZADO EM PANQUECAS','RESTAURANTE DE GASTRONOMIA DO LESTE AFRICANO','RESTAURANTE ROMANO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DA TOSCANA','RESTAURANTE DA COSTA DO PACÍFICO','RESTAURANTE INDIANO MODERNO','RESTAURANTE DE GASTRONOMIA DO SUDESTE ASIÁTICO','RESTAURANTE ESPECIALIZADO EM KAISEKI','RESTAURANTE AUSTRALIANO MODERNO','RESTAURANTE DINAMARQUÊS','RESTAURANTE ASTURIANO','RESTAURANTE DE GASTRONOMIA DO SUL DA ITÁLIA','PIZZARIA','HAMBURGUERIA','GASTROPUB','CHURRASCARIA','BISTRÔ','SANDUICHERIA','PASTELARIA','CREPERIA','MERCEARIA JAPONESA','MERCEARIA ITALIANA','MERCEARIA ATACADISTA','MERCEARIA KOSHER','MERCEARIA COREANA','DELICATESSEN','BRASSERIE','ESFIHARIA']";                        
                            //var ss = "['ESTÚDIO DE TATUAGEM','ESTÚDIO DE TATUAGEM E COLOCAÇÃO DE PIERCING']";
    
                            var categories_ss = "";
                            categories.forEach(c => {
                                if(categories_ss.length > 0){
                                    categories_ss += ",";
                                }
                                categories_ss += c.categories;
                            });
    
                            console.log("SOS: " + categories_ss);
                            /*         
                            var query_subtype =
                            "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(case pos.taken_date >= '" + dd + "' when true then 1 else null end) as count " +
                            "FROM locales loc " +
                            "FULL JOIN posts pos on loc.id = pos.local_id " + 
                            "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                            "INNER JOIN districts dis on ads.district_id = dis.id " + 
                            //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                            "WHERE upper(google_data_scrape ->> 'category') LIKE ANY (array[" + categories_ss + "]) AND " + where_stament + " " +
                            "GROUP BY loc.id, pos.local_id, dis.id " + 
                            "ORDER BY count DESC " +
                            "LIMIT 30";*/

                            
                            var query_subtype =
                            "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as countito, loc.google_data_scrape, ads.line, count(postito.id) as count " +
                            "FROM locales loc " +
                            //"FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd + "' " + 
                            "FULL JOIN posts pos on loc.id = pos.local_id and pos.taken_date >= '" + dd_v + "'" + 
                            "FULL JOIN posts postito on pos.id = postito.id and pos.taken_date >= '" + dd + "' " +
                            "INNER JOIN addresses ads on loc.address_id = ads.id " + 
                            "INNER JOIN districts dis on ads.district_id = dis.id " + 
                            //"WHERE local_cat.category_id = 5 AND " + where_stament + " " +
                            "WHERE upper(google_data_scrape ->> 'category') LIKE ANY (array[" + categories_ss + "]) AND " + where_stament + " " +
                            "GROUP BY loc.id, pos.local_id, dis.id, ads.line " + 
                            "ORDER BY count DESC, countito DESC " +
                            "LIMIT 30";
        
                            if(filter.off){
                                query_subtype += " OFFSET " + filter.off;
                            }
        
                            //console.log("getLocales q: " + query_subtype);

                            sequelize.query(query_subtype).spread((result, metadata) => {
                                resolve(result);
                                console.log("result: " + result.length);
        
                                console.log("CHAPULETEI: " + new Date());
        
                            }).catch(function (err) {
                                console.log("getLocales q ERR: " + err);
                            });
    
                        });
                        
                    }

                }else{

                    var query_subtype = "";
                    if(where_stament.length > 0){
                        query_subtype =
                        "SELECT loc.*, count(pos.local_id) " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "WHERE " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id " + 
                        "ORDER BY count(pos.local_id) DESC;" 
                    }else{
                        query_subtype =
                        "SELECT loc.*, count(pos.local_id) " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "GROUP BY loc.id, pos.local_id " + 
                        "ORDER BY count(pos.local_id) DESC;" 
                    }
                    
                    sequelize.query(query_subtype).spread((result, metadata) => {
                        //console.log(JSON.stringify(result));
                        resolve(result);
                    });

                }

            }
        })
    }

    function t2(resolve){
        var dd = moment(new Date()).subtract(180, 'minutes').toDate();
        console.log(moment(dd).format("YYYY-MM-DD HH:mm:ss"));
        
        Local.findAll({
            attributes: [
                'id', 
                'name', 
                'origin_picture_url', 
                'google_data_scrape',
                [Sequelize.fn("COUNT", Sequelize.col("post.id")), "count"]
            ],
            where: {
                address_id: {
                    not: null
                }
            },
            include: [
                {
                    model: Address,
                    as: "address",
                    attributes: ['district_id'],
                    where: {
                        district_id: 2
                    },
                    include: [
                        {
                            model: District,
                            as: "district",
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: Post,
                    as: "post",
                    attributes: [],
                    where: {
                        taken_date: {
                            gte: moment(dd).format("YYYY-MM-DD HH:mm:ss") + "+00"
                        },
                        is_video: true,
                    },
                    duplicating: false
                }
            ],
            group: ['locales.id', 'address.id', 'address.district.id'],
            limit: 15,
            order: [
                ["count", "DESC"]
            ]
        }).then(locales => {	
            console.log("CHAPULETEI: " + new Date());
            resolve(locales);
            console.log("i: " + JSON.stringify(locales[0]));

        });	
    }

    function getLocalesTrends(filter){
		return new Promise((resolve, reject) => {

            let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();
            
            var where_stament = "";

            if(filter.city_id){
                where_stament = "ads.district_id = " + filter.city_id;
            }

            if(filter.range_minutes){

                if(where_stament.length > 0){
                    where_stament += " AND ";
                }

                var dd_start = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                var dd_end = moment(new Date()).add(parseInt(filter.range_minutes), 'minutes').subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                //where_stament += "pos.taken_date >= '" + dd + "'";
                //where_stament += "pos.taken_date >= '" + dd_start + "' AND pos.taken_date <= '" + dd_end + "'";
                where_stament += "((pos.taken_date >= '" + dd_start + "' AND pos.taken_date <= '" + dd_end + "') OR (pos.taken_date >= '" + moment(dd_start).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "' AND pos.taken_date <= '" + moment(dd_end).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "'))";

                if(filter.exclude){
                    if(where_stament.length > 0){
                        where_stament += " AND ";
                    }
                    where_stament += "loc.id NOT IN " + filter.exclude;
                }
                
                //var dd_valid = moment(new Date()).subtract(4, 'hours').add(1, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                var dd_valid = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "+00";

                if(!filter.category_id){

                    console.log("SEM CATEGORY");

                    var query_subtype =
                    "SELECT loc.id " +
                    "FROM locales loc " +
                    "INNER JOIN posts pos on loc.id = pos.local_id " + 
                    "INNER JOIN posts postito on loc.id = postito.local_id " + 
                    "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                    "INNER JOIN districts dis on ads.district_id = dis.id " + 
                    //"WHERE postito.expired_date >= '" + dd_valid + "' AND " + where_stament + " " +
                    "WHERE " + where_stament + " " +
                    "GROUP BY loc.id, pos.local_id " + 
                    "ORDER BY (count(pos.local_id)/2) DESC " +
                    "LIMIT 30";

                    if(filter.off){
                        query_subtype += " OFFSET " + filter.off;
                    }

                    //console.log("getLocalesTrends par 1 q: " + query_subtype);
                    
                    sequelize.query(query_subtype).spread((result, metadata) => {
                        //console.log(JSON.stringify(result));
                        //console.log(result.length);
                        //console.log(JSON.stringify(result[0]));
                        //console.log(JSON.stringify(result[1]));

                        //resolve(result);

                        if(result && result.length > 0){
                            var filter_id = result.map(function(l) {
                                return l.id;
                            });
                            filter_id = JSON.stringify(filter_id);
                            filter_id = filter_id.replace("[", "(").replace("]", ")");

                            //query_subtype = "SELECT COUNT(posts.id) FROM posts WHERE posts.local_id = " + result[0].id + " AND posts.expired_date >= '" + dd_valid + "'";
                            //"SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, (SELECT potito.id FROM posts potito WHERE potito.local_id = loc.id AND potito.expired_date >= '" + dd_valid + "' LIMIT 1) as count_potito " +

                            //var dd_count = moment(new Date()).subtract(4, 'hours').format("YYYY-MM-DD HH:mm:ss") + "+00";
                            //pos.taken_date >= '" + dd_count + "'
                            var dd_count = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "+00";

                            query_subtype = 
                            "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as count " +
                            "FROM locales loc " +
                            "FULL JOIN posts pos on loc.id = pos.local_id and pos.expired_date >= '" + dd_count + "' " + 
                            "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                            "INNER JOIN districts dis on ads.district_id = dis.id " + 
                            "WHERE loc.id IN " + filter_id + " " +
                            "GROUP BY loc.id, pos.local_id, dis.id " +
                            "ORDER BY count DESC";

                            //console.log("getLocalesTrends par 2 q: " + query_subtype);
                            
                            sequelize.query(query_subtype).spread((result_count, metadata) => {
                                //console.log(JSON.stringify(result_count[0]));
                                //console.log(JSON.stringify(result_count[1]));

                                resolve(result_count);

                                /*
                                for (let index = 0; index < result_count.length; index++) {
                                    var e = result_count[index];
                                    var index_arr = filter_id.indexOf(e.id);
                                    if(index_arr != -1){
                                        result[index_arr].has_stories = true;
                                    }
                                }*/

                                //console.log(JSON.stringify(result[0]));
                                //console.log(JSON.stringify(result[1]));
                            }).catch(function (err) {
                                console.log("getLocalesTrends par 2 q ERR: " + err);
                            });

                        }else{
                            resolve(result);
                        }

                    }).catch(function (err) {
                        console.log("getLocalesTrends par 1 q ERR: " + err);
                    });

                }else{
                 
                    filter.category_id = parseInt(filter.category_id);

                    Category.findAll({
                        attributes: ['categories'],
                        where:{
                            id: {
                                in: [filter.category_id]
                            }
                        }
                    }).then(categories => {	
                        //var ss = "['RESTAURANTE','RESTAURANTE JAPONÊS','RESTAURANTE FAST-FOOD','RESTAURANTE ITALIANO','RESTAURANTE SELF-SERVICE','RESTAURANTE DE FRUTOS DO MAR','RESTAURANTE FRANCÊS','RESTAURANTE MEXICANO','RESTAURANTE NORTE-AMERICANO','RESTAURANTE DE SUSHI','RESTAURANTE MEDITERRÂNEO','RESTAURANTE CHINÊS','RESTAURANTE BRASILEIRO','RESTAURANTE VIETNAMITA','RESTAURANTE DE CAFÉ DA MANHÃ','RESTAURANTE DO ORIENTE MÉDIO','RESTAURANTE DE FRANGO','RESTAURANTE INDIANO','RESTAURANTE DE COMIDA NATURAL','RESTAURANTE VEGANO','RESTAURANTE TAILANDÊS','RESTAURANTE DE CARNE','RESTAURANTE ASIÁTICO','RESTAURANTE LIBANÊS','RESTAURANTE MINEIRO','RESTAURANTE COREANO','RESTAURANTE DE GASTRONOMIA MODERNA DOS EUA','RESTAURANTE ESPECIALIZADO EM RAMEN','RESTAURANTE VEGETARIANO','RESTAURANTE AUSTRALIANO','RESTAURANTE ARGENTINO','RESTAURANTE PERUANO','RESTAURANTE DE BRUNCH','RESTAURANTE PORTUGUÊS','RESTAURANTE CALIFORNIANO','RESTAURANTE ESPANHOL','RESTAURANTE GREGO','RESTAURANTE ALEMÃO','RESTAURANTE REFINADO','RESTAURANTE TURCO','RESTAURANTE FILIPINO','RESTAURANTE HAVAIANO','RESTAURANTE DE SOPAS','RESTAURANTE ORGÂNICO','RESTAURANTE DE GASTRONOMIA DE EL SALVADOR','RESTAURANTE DE COMIDA CASEIRA','RESTAURANTE LATINO-AMERICANO','RESTAURANTE PERSA','RESTAURANTE ESPECIALIZADO EM HOT POT','RESTAURANTE ESPECIALIZADO EM DIM SUM','RESTAURANTE DE GASTRONOMIA DE FUSÃO ASIÁTICA','RESTAURANTE ESPECIALIZADO EM TAPAS','RESTAURANTE DE CHURRASCO COREANO','RESTAURANTE ECLÉTICO','RESTAURANTE PAQUISTANÊS','RESTAURANTE MARROQUINO','RESTAURANTE AFRICANO','RESTAURANTE DE CHURRASQUINHO','RESTAURANTE FRANCÊS MODERNO','RESTAURANTE DE ALIMENTOS SEM GLÚTEN','RESTAURANTE ESPECIALIZADO EM CARNES','RESTAURANTE ESPECIALIZADO EM ASINHAS DE FRANGO','RESTAURANTE DE FONDUE','RESTAURANTE SÍRIO','RESTAURANTE DE TACO','RESTAURANTE ESPECIALIZADO EM SHABU-SHABU','RESTAURANTE DE COMIDA PARA VIAGEM','RESTAURANTE DE GASTRONOMIA TEX-MEX','RESTAURANTE DE SOUL FOOD','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DO SUL DOS EUA','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE SICHUAN','RESTAURANTE JAPONÊS ESPECIALIZADO EM CARNES','RESTAURANTE COLOMBIANO','RESTAURANTE RUSSO','RESTAURANTE E IZAKAYA','RESTAURANTE ETÍOPE','RESTAURANTE ESPECIALIZADO EM SUSHI SERVIDO EM ESTEIRA GIRATÓRIA','RESTAURANTE DE FALAFEL','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DE FUSÃO','RESTAURANTE ESPECIALIZADO EM FISH AND CHIPS','RESTAURANTE BIRMANÊS','RESTAURANTE ESPECIALIZADO EM SANDUÍCHES GIGANTES HOAGIES','BAR E RESTAURANTE DE OSTRAS','RESTAURANTE DE GASTRONOMIA TRADICIONAL DOS EUA','RESTAURANTE DE GASTRONOMIA DO TAIWAN','RESTAURANTE IEMENITA','RESTAURANTE ESPECIALIZADO EM DUMPLINGS','RESTAURANTE ESPECIALIZADO EM PHO','RESTAURANTE FAMILIAR','RESTAURANTE DE GASTRONOMIA CAJUN','RESTAURANTE EGÍPCIO','RESTAURANTE BASCO','RESTAURANTE DE GASTRONOMIA FRANCESA SOFISTICADA','RESTAURANTE DA ERITREIA','RESTAURANTE ESPECIALIZADO EM CUSCUZ','RESTAURANTE ESPECIALIZADO EM DOCES JAPONESES','RESTAURANTE ESPECIALIZADO EM CULINÁRIA HALAL','RESTAURANTE ISRAELITA','RESTAURANTE DE GASTRONOMIA DO AFEGANISTÃO','RESTAURANTE JAPONÊS AUTÊNTICO','RESTAURANTE POPULAR','RESTAURANTE CANTONÊS','RESTAURANTE CUBANO','RESTAURANTE BELGA','RESTAURANTE DE BURRITO','RESTAURANTE ESPECIALIZADO EM YAKISSOBA','RESTAURANTE ESPECIALIZADO EM SANDUÍCHES CHEESESTEAKS','RESTAURANTE TCHECO','RESTAURANTE CANADENSE','RESTAURANTE JAMAICANO','RESTAURANTE ESPECIALIZADO EM CARANGUEJOS','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE GALÍCIA','RESTAURANTE URUGUAIO','RESTAURANTE LAOSIANO','RESTAURANTE NEPALÊS','RESTAURANTE DE GASTRONOMIA LATINO-AMERICANA MODERNA','RESTAURANTE ESPECIALIZADO EM CHURRASCO MONGOL','RESTAURANTE JUDEU','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE HUNAN','RESTAURANTE VENEZUELANO','RESTAURANTE CONTINENTAL','RESTAURANTE ESPECIALIZADO EM UDON','RESTAURANTE ESCANDINAVO','RESTAURANTE ESPECIALIZADO EM COSTELETAS','RESTAURANTE PAN-ASIÁTICO','RESTAURANTE MALAIO','RESTAURANTE CARIBENHO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DO CAMBOJA','RESTAURANTE DE CARNES FRANCÊS','RESTAURANTE EUROPEU','RESTAURANTE INDONÉSIO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE CATALUNHA','RESTAURANTE ARMÊNIO','RESTAURANTE BRITÂNICO','RESTAURANTE ESPECIALIZADO EM YAKITORI','RESTAURANTE ESPECIALIZADO EM CURRY JAPONÊS','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA SUL-AMERICANA','RESTAURANTE DE GASTRONOMIA DO SRI LANKA','RESTAURANTE CASTELHANO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DE ALSACE','RESTAURANTE AUSTRÍACO','RESTAURANTE ESPECIALIZADO EM SUKIYAKI E SHABU SHABU','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DO SUDOESTE DOS EUA','RESTAURANTE DE CULINÁRIA JAPONESA COM INFLUÊNCIA OCIDENTAL','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA NICARÁGUA','RESTAURANTE OU CAFÉ','RESTAURANTE MANDARIM','RESTAURANTE JAPONÊS ESPECIALIZADO EM LÍNGUA','RESTAURANTE HOLANDÊS','RESTAURANTE PORTO-RIQUENHO','RESTAURANTE ESPECIALIZADO EM CURRY INDIANO','RESTAURANTE DE COMIDA CRUA','RESTAURANTE DE GASTRONOMIA DE CABO VERDE','RESTAURANTE ÉTNICO','RESTAURANTE EQUATORIANO','RESTAURANTE CHILENO','RESTAURANTE DE GASTRONOMIA CRIOULA','RESTAURANTE INGLÊS','RESTAURANTE IRLANDÊS','RESTAURANTE DE GASTRONOMIA DO OESTE AFRICANO','RESTAURANTE KOSHER','RESTAURANTE HAITIANO','RESTAURANTE DE GASTRONOMIA DO NORTE DA ITÁLIA','RESTAURANTES COM DELIVERY','RESTAURANTE OCIDENTAL','RESTAURANTE EPECIALIZADO EM PANQUECAS','RESTAURANTE DE GASTRONOMIA DO LESTE AFRICANO','RESTAURANTE ROMANO','RESTAURANTE ESPECIALIZADO EM GASTRONOMIA DA REGIÃO DA TOSCANA','RESTAURANTE DA COSTA DO PACÍFICO','RESTAURANTE INDIANO MODERNO','RESTAURANTE DE GASTRONOMIA DO SUDESTE ASIÁTICO','RESTAURANTE ESPECIALIZADO EM KAISEKI','RESTAURANTE AUSTRALIANO MODERNO','RESTAURANTE DINAMARQUÊS','RESTAURANTE ASTURIANO','RESTAURANTE DE GASTRONOMIA DO SUL DA ITÁLIA','PIZZARIA','HAMBURGUERIA','GASTROPUB','CHURRASCARIA','BISTRÔ','SANDUICHERIA','PASTELARIA','CREPERIA','MERCEARIA JAPONESA','MERCEARIA ITALIANA','MERCEARIA ATACADISTA','MERCEARIA KOSHER','MERCEARIA COREANA','DELICATESSEN','BRASSERIE','ESFIHARIA']";                        
                        //var ss = "['ESTÚDIO DE TATUAGEM','ESTÚDIO DE TATUAGEM E COLOCAÇÃO DE PIERCING']";

                        var categories_ss = "";
                        categories.forEach(c => {
                            if(categories_ss.length > 0){
                                categories_ss += ",";
                            }
                            categories_ss += c.categories;
                        });

                        console.log("SOS TRENDS: " + categories_ss);
                        
                        var query_subtype =
                        "SELECT loc.id " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN posts postito on loc.id = postito.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "INNER JOIN districts dis on ads.district_id = dis.id " + 
                        //"WHERE postito.expired_date >= '" + dd_valid + "' AND " + where_stament + " " +
                        "WHERE upper(google_data_scrape ->> 'category') LIKE ANY (array[" + categories_ss + "]) AND " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id " + 
                        "ORDER BY (count(pos.local_id)/2) DESC " +
                        "LIMIT 30";
    
                        if(filter.off){
                            query_subtype += " OFFSET " + filter.off;
                        }
    
                        //console.log("getLocalesTrends par 1 q: " + query_subtype);
                        
                        sequelize.query(query_subtype).spread((result, metadata) => {
                            //console.log(JSON.stringify(result));
                            //console.log(result.length);
                            //console.log(JSON.stringify(result[0]));
                            //console.log(JSON.stringify(result[1]));
    
                            //resolve(result);
    
                            if(result && result.length > 0){
                                var filter_id = result.map(function(l) {
                                    return l.id;
                                });
                                filter_id = JSON.stringify(filter_id);
                                filter_id = filter_id.replace("[", "(").replace("]", ")");
    
                                //query_subtype = "SELECT COUNT(posts.id) FROM posts WHERE posts.local_id = " + result[0].id + " AND posts.expired_date >= '" + dd_valid + "'";
                                //"SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, (SELECT potito.id FROM posts potito WHERE potito.local_id = loc.id AND potito.expired_date >= '" + dd_valid + "' LIMIT 1) as count_potito " +
    
                                //var dd_count = moment(new Date()).subtract(4, 'hours').format("YYYY-MM-DD HH:mm:ss") + "+00";
                                //pos.taken_date >= '" + dd_count + "'
                                var dd_count = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "+00";
    
                                query_subtype = 
                                "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, count(pos.local_id) as count " +
                                "FROM locales loc " +
                                "FULL JOIN posts pos on loc.id = pos.local_id and pos.expired_date >= '" + dd_count + "' " + 
                                "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                                "INNER JOIN districts dis on ads.district_id = dis.id " + 
                                "WHERE loc.id IN " + filter_id + " " +
                                "GROUP BY loc.id, pos.local_id, dis.id " +
                                "ORDER BY count DESC";
    
                                //console.log("getLocalesTrends par 2 q: " + query_subtype);
                                
                                sequelize.query(query_subtype).spread((result_count, metadata) => {
                                    //console.log(JSON.stringify(result_count[0]));
                                    //console.log(JSON.stringify(result_count[1]));
    
                                    resolve(result_count);
    
                                    /*
                                    for (let index = 0; index < result_count.length; index++) {
                                        var e = result_count[index];
                                        var index_arr = filter_id.indexOf(e.id);
                                        if(index_arr != -1){
                                            result[index_arr].has_stories = true;
                                        }
                                    }*/
    
                                    //console.log(JSON.stringify(result[0]));
                                    //console.log(JSON.stringify(result[1]));
                                }).catch(function (err) {
                                    console.log("getLocalesTrends par 2 q ERR: " + err);
                                });
    
                            }else{
                                resolve(result);
                            }
    
                        }).catch(function (err) {
                            console.log("getLocalesTrends par 1 q ERR: " + err);
                        });                        

                    });                    
                }

            }else{
                resolve([]);
            }
        })
    }

    function getLocalesTrendsBk2(filter){
		return new Promise((resolve, reject) => {

            let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();
            
            var where_stament = "";

            if(filter.city_id){
                where_stament = "ads.district_id = " + filter.city_id;
            }

            if(filter.range_minutes){

                if(where_stament.length > 0){
                    where_stament += " AND ";
                }

                var dd_start = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                var dd_end = moment(new Date()).add(parseInt(filter.range_minutes), 'minutes').subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                //where_stament += "pos.taken_date >= '" + dd + "'";
                //where_stament += "pos.taken_date >= '" + dd_start + "' AND pos.taken_date <= '" + dd_end + "'";
                where_stament += "((pos.taken_date >= '" + dd_start + "' AND pos.taken_date <= '" + dd_end + "') OR (pos.taken_date >= '" + moment(dd_start).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "' AND pos.taken_date <= '" + moment(dd_end).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "'))";

                if(filter.exclude){
                    if(where_stament.length > 0){
                        where_stament += " AND ";
                    }
                    where_stament += "loc.id NOT IN " + filter.exclude;
                }
                
                var dd_valid = moment(new Date()).subtract(4, 'hours').add(1, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";

                var query_subtype =
                "SELECT loc.id " +
                "FROM locales loc " +
                "INNER JOIN posts pos on loc.id = pos.local_id " + 
                "INNER JOIN posts postito on loc.id = postito.local_id " + 
                "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                "INNER JOIN districts dis on ads.district_id = dis.id " + 
                "WHERE postito.expired_date >= '" + dd_valid + "' AND " + where_stament + " " +
                "GROUP BY loc.id, pos.local_id " + 
                "ORDER BY (count(pos.local_id)/2) DESC " +
                "LIMIT 30";

                if(filter.off){
                    query_subtype += " OFFSET " + filter.off;
                }

                //console.log("getLocalesTrends par 1 q: " + query_subtype);
                
                sequelize.query(query_subtype).spread((result, metadata) => {
                    //console.log(JSON.stringify(result));
                    //console.log(result.length);
                    //console.log(JSON.stringify(result[0]));
                    //console.log(JSON.stringify(result[1]));

                    //resolve(result);

                    if(result && result.length > 0){
                        var filter_id = result.map(function(l) {
                            return l.id;
                        });
                        filter_id = JSON.stringify(filter_id);
                        filter_id = filter_id.replace("[", "(").replace("]", ")");

                        //query_subtype = "SELECT COUNT(posts.id) FROM posts WHERE posts.local_id = " + result[0].id + " AND posts.expired_date >= '" + dd_valid + "'";
                        //"SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, (SELECT potito.id FROM posts potito WHERE potito.local_id = loc.id AND potito.expired_date >= '" + dd_valid + "' LIMIT 1) as count_potito " +
                        query_subtype = 
                        "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "INNER JOIN districts dis on ads.district_id = dis.id " + 
                        "WHERE loc.id IN " + filter_id + " AND pos.expired_date >= '" + dd_valid + "' " +
                        "GROUP BY loc.id, pos.local_id, dis.id " +
                        "ORDER BY count(pos.local_id) DESC";

                        //console.log("getLocalesTrends par 2 q: " + query_subtype);
                        
                        sequelize.query(query_subtype).spread((result_count, metadata) => {
                            //console.log(JSON.stringify(result_count[0]));
                            //console.log(JSON.stringify(result_count[1]));

                            resolve(result_count);

                            /*
                            for (let index = 0; index < result_count.length; index++) {
                                var e = result_count[index];
                                var index_arr = filter_id.indexOf(e.id);
                                if(index_arr != -1){
                                    result[index_arr].has_stories = true;
                                }
                            }*/

                            //console.log(JSON.stringify(result[0]));
                            //console.log(JSON.stringify(result[1]));
                        }).catch(function (err) {
                            console.log("getLocalesTrends par 2 q ERR: " + err);
                        });

                    }else{
                        resolve(result);
                    }

                }).catch(function (err) {
                    console.log("getLocalesTrends par 1 q ERR: " + err);
                });

            }else{
                resolve([]);
            }
        })
    }

    function getLocalesTrendsBk(filter){
		return new Promise((resolve, reject) => {

            let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();
            
            var where_stament = "";

            if(filter.city_id){
                where_stament = "ads.district_id = " + filter.city_id;
            }

            if(filter.date_start){

                var ds = moment(new Date(filter.date_start)).format("YYYY-MM-DD HH:mm:ss");
                var de = moment(new Date(filter.date_end)).format("YYYY-MM-DD HH:mm:ss");

                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament += "pos.taken_date >= '" + ds + "' AND pos.taken_date <= '" + de + "'"; 

                
                //dd = "2019-05-05 17:00:00";
                //var dda = "2019-05-06 05:00:00";
                //where_stament += "pos.taken_date >= '" + dd + "' AND pos.taken_date <= '" + dda + "'";         

                var query_subtype =
                "SELECT loc.*, count(pos.local_id) " +
                "FROM locales loc " +
                "INNER JOIN posts pos on loc.id = pos.local_id " + 
                "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                "WHERE " + where_stament + " " +
                "GROUP BY loc.id, pos.local_id " + 
                "ORDER BY count(pos.local_id) DESC;" 
                //"LIMIT 10";	
                
                sequelize.query(query_subtype).spread((result, metadata) => {
                    //console.log(JSON.stringify(result));
                    resolve(result);
                });

            }else{

                if(filter.range_minutes){

                    if(where_stament.length > 0){
                        where_stament += " AND ";
                    }

                    var dd_start = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                    var dd_end = moment(new Date()).add(parseInt(filter.range_minutes), 'minutes').subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "+00";
                    //where_stament += "pos.taken_date >= '" + dd + "'";
                    //where_stament += "pos.taken_date >= '" + dd_start + "' AND pos.taken_date <= '" + dd_end + "'";
                    where_stament += "((pos.taken_date >= '" + dd_start + "' AND pos.taken_date <= '" + dd_end + "') OR (pos.taken_date >= '" + moment(dd_start).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "' AND pos.taken_date <= '" + moment(dd_end).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss") + "'))";

                    /*
                    var date_s = moment(new Date()).subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss");
                    var date_e = moment(new Date()).add(parseInt(filter.range_minutes), 'minutes').subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss");
                    if( moment(date_s).date() == moment(date_e).date() ){

                        var hour_s = moment(new Date()).hour();
                        var hour_e = moment(new Date()).add(parseInt(filter.range_minutes), 'minutes').hour();

                        //where_stament += "pos.taken_date >= '" + dd + "'";
                        where_stament += 
                        "EXTRACT(DOW FROM pos.taken_date) = '" + moment(date_s).day() + "' AND ( EXTRACT(hour FROM pos.taken_date) >= " + hour_s +  " AND EXTRACT(hour FROM pos.taken_date) <= " + hour_e +  " )";
                    }else{
                    }*/

                    if(filter.exclude){
                        if(where_stament.length > 0){
                            where_stament += " AND ";
                        }
                        where_stament += "loc.id NOT IN " + filter.exclude;
                    }
                    
                    //moment().day();
                    //var query_subtype =
                    //"WHERE EXTRACT(DOW FROM posts.taken_date) = '6' AND ( EXTRACT(hour FROM posts.taken_date) >= 13 AND EXTRACT(hour FROM posts.taken_date) <= 14 ) ORDER BY posts.id DESC;"

                    var dd_valid = moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "+00";

                    //(SELECT COUNT(potito.id) FROM posts potito WHERE potito.local_id = loc.id AND potito.expired_date >= '" + dd_valid + "') as count_potito
                    /*
                    var query_subtype =
                    "SELECT loc.*, dis.name as city " +
                    "FROM locales loc " +
                    "INNER JOIN posts pos on loc.id = pos.local_id " + 
                    "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                    "INNER JOIN districts dis on ads.district_id = dis.id " + 
                    "WHERE " + where_stament + " " +
                    "GROUP BY loc.id, pos.local_id, dis.id " + 
                    "ORDER BY (count(pos.local_id)/2) DESC " +
                    "LIMIT 60";*/
                    //"LIMIT 10";	

                    var query_subtype =
                    "SELECT loc.id " +
                    "FROM locales loc " +
                    "INNER JOIN posts pos on loc.id = pos.local_id " + 
                    "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                    "INNER JOIN districts dis on ads.district_id = dis.id " + 
                    "WHERE " + where_stament + " " +
                    "GROUP BY loc.id, pos.local_id " + 
                    "ORDER BY (count(pos.local_id)/2) DESC " +
                    "LIMIT 30";

                    if(filter.off){
                        query_subtype += " OFFSET " + filter.off;
                    }

                    //console.log("getLocalesTrends par 1 q: " + query_subtype);
                    
                    sequelize.query(query_subtype).spread((result, metadata) => {
                        //console.log(JSON.stringify(result));
                        //console.log(JSON.stringify(result[0]));
                        //console.log(JSON.stringify(result[1]));

                        //resolve(result);

                        if(result && result.length > 0){
                            var filter_id = result.map(function(l) {
                                return l.id;
                            });
                            filter_id = JSON.stringify(filter_id);
                            filter_id = filter_id.replace("[", "(").replace("]", ")");
    
                            //query_subtype = "SELECT COUNT(posts.id) FROM posts WHERE posts.local_id = " + result[0].id + " AND posts.expired_date >= '" + dd_valid + "'";
                            query_subtype = 
                            "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, (SELECT potito.id FROM posts potito WHERE potito.local_id = loc.id AND potito.expired_date >= '" + dd_valid + "' LIMIT 1) as count_potito " +
                            "FROM locales loc " +
                            "INNER JOIN posts pos on loc.id = pos.local_id " + 
                            "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                            "INNER JOIN districts dis on ads.district_id = dis.id " + 
                            "WHERE loc.id IN " + filter_id + " AND pos.expired_date >= '" + dd_valid + "' " +
                            "GROUP BY loc.id, pos.local_id, dis.id " +
                            "ORDER BY count(pos.local_id) DESC";
    
                            //console.log("getLocalesTrends par 2 q: " + query_subtype);
                            
                            sequelize.query(query_subtype).spread((result_count, metadata) => {
                                //console.log(JSON.stringify(result_count[0]));
                                //console.log(JSON.stringify(result_count[1]));
    
                                resolve(result_count);
    
                                /*
                                for (let index = 0; index < result_count.length; index++) {
                                    var e = result_count[index];
                                    var index_arr = filter_id.indexOf(e.id);
                                    if(index_arr != -1){
                                        result[index_arr].has_stories = true;
                                    }
                                }*/
    
                                //console.log(JSON.stringify(result[0]));
                                //console.log(JSON.stringify(result[1]));
                            }).catch(function (err) {
                                console.log("getLocalesTrends par 2 q ERR: " + err);
                            });

                        }else{
                            resolve(result);
                        }

                    }).catch(function (err) {
                        console.log("getLocalesTrends par 1 q ERR: " + err);
                    });

                }else{

                    var query_subtype = "";
                    if(where_stament.length > 0){
                        query_subtype =
                        "SELECT loc.*, count(pos.local_id) " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "WHERE " + where_stament + " " +
                        "GROUP BY loc.id, pos.local_id " + 
                        "ORDER BY count(pos.local_id) DESC;" 
                    }else{
                        query_subtype =
                        "SELECT loc.*, count(pos.local_id) " +
                        "FROM locales loc " +
                        "INNER JOIN posts pos on loc.id = pos.local_id " + 
                        "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                        "GROUP BY loc.id, pos.local_id " + 
                        "ORDER BY count(pos.local_id) DESC;" 
                    }
                    
                    sequelize.query(query_subtype).spread((result, metadata) => {
                        //console.log(JSON.stringify(result));
                        resolve(result);
                    });

                }

            }
        })
    }

    function getPosts(filter){
		return new Promise((resolve, reject) => {

            var dd = moment(new Date()).subtract(24, 'hours').toDate();
            Post.findAll({
                attributes: ['id', 'taken_date', 'url', 'display_url'],
                where:{
                    local_id: filter.local_id,
                    taken_date: {
                        gte: dd
                    },
                    is_video: true
                },
                order: [
                    [ 'taken_date', 'DESC' ]
                ],
                limit: 100
            }).then(posts => {	
                
                Local.findOne({
                    attributes: ['id', 'name', 'origin_picture_url'],
                    where:{
                        id: filter.local_id
                    }
                }).then(local => {	
                    resolve({ local: local, posts: posts });
                });
            });
            /*
            Post.findAll({
                where:{
                    local_id: filter.local_id,
                    taken_date: {
                        gte: dd
                    },
                    is_video: true
                },
                include: [
                    {
                        model: Profile,
                        as: "profile"
                    }
                ],
                order: [
                    [ 'taken_date', 'DESC' ]
                ],
                limit: 100
            }).then(posts => {	

                Local.findOne({
                    where:{
                        id: filter.local_id
                    }
                }).then(local => {	
                    resolve({ local: local, posts: posts });
                });
            });*/
        })
    }

    function getAllPosts(filter){
		return new Promise((resolve, reject) => {

            /*

            let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();
            
            var where_stament = "";

            if(filter.city_id){
                where_stament = "ads.district_id = " + filter.city_id;
            }

            if(filter.range_minutes){

                var dd = moment(new Date()).subtract(parseInt(filter.range_minutes), 'minutes').format("YYYY-MM-DD HH:mm:ss");

                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament += "pos.taken_date >= '" + dd + "'";

                var query_subtype =
                "SELECT loc.*, count(pos.local_id) " +
                "FROM locales loc " +
                "INNER JOIN posts pos on loc.id = pos.local_id " + 
                "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                "WHERE " + where_stament + " " +
                "GROUP BY loc.id, pos.local_id " + 
                "ORDER BY count(pos.local_id) DESC;" 
                //"LIMIT 10";	
                
                sequelize.query(query_subtype).spread((result, metadata) => {
                    //console.log(JSON.stringify(result));
                    resolve(result);
                });

            }else{

                var query_subtype = "";
                if(where_stament.length > 0){
                    query_subtype =
                    "SELECT loc.*, count(pos.local_id) " +
                    "FROM locales loc " +
                    "INNER JOIN posts pos on loc.id = pos.local_id " + 
                    "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                    "WHERE " + where_stament + " " +
                    "GROUP BY loc.id, pos.local_id " + 
                    "ORDER BY count(pos.local_id) DESC;" 
                }else{
                    query_subtype =
                    "SELECT loc.*, count(pos.local_id) " +
                    "FROM locales loc " +
                    "INNER JOIN posts pos on loc.id = pos.local_id " + 
                    "INNER JOIN adresses ads on loc.address_id = ads.id " + 
                    "GROUP BY loc.id, pos.local_id " + 
                    "ORDER BY count(pos.local_id) DESC;" 
                }
                
                sequelize.query(query_subtype).spread((result, metadata) => {
                    //console.log(JSON.stringify(result));
                    resolve(result);
                });

            } */           

            var dd = moment(new Date()).subtract(parseInt(filter.range_minutes), 'minutes').toDate();
            
            Post.findAll({
                where:{
                    taken_date: {
                        gte: dd
                    }
                },
                include: [
                    {
                        model: Local,
                        as: "local",
                        where: {
                            type: {
                                not: 1
                            }
                        },
                        include: [
                            {
                                model: Address,
                                as: "address",
                                where: {
                                    district_id: filter.city_id
                                }
                            }
                        ]
                    },
                    {
                        model: Profile,
                        as: "profile"
                    }
                ],
                order: [
                    [ 'taken_date', 'DESC' ]
                ]
            }).then(posts => {	
                //console.log(JSON.stringify(posts));
                resolve(posts);
            });
        })
    }

    function postUpdate(changes, id){
		return new Promise((resolve, reject) => {

            if(changes.type){
                Local.update(changes, {
                    where: {
                        id: id
                    }
                }).then(updatePost => {
                    resolve(updatePost);
                    console.log("ei");
                });
            }else{
                Post.update(changes, {
                    where: {
                        id: id
                    }
                }).then(updatePost => {
                    resolve(updatePost);
                });
            }

        })

    }

    function getLocal(filter){
		return new Promise((resolve, reject) => {

            Local.findOne({
                where: {
                    id: filter.id
                },
                include: [
                    {
                        model: Address,
                        as: "address",
                        include: [
                            {
                                model: District,
                                as: "district",
                                include: [
                                    {
                                        model: City,
                                        as: "city"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }).then(local => {

                if(filter.info == "1"){
                    //get local db

                    if(local.address){

                        if( (!local.address.line || local.address.line.length == 0) && (local.address.lat && local.address.long) ){

                            if(local.google_data_scrape == null || local.google_data_scrape.address == null){

                                console.log("buscando address completo!");

                                request({
                                    url: "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + local.address.lat + "," + local.address.long + "&key=AIzaSyBHbmJ1Or65GXXj8dinoikc8oxW367f7VE",
                                    method: "GET",
                                    json: true,
                                    headers: {
                                        "Content-Type": "application/json"
                                    }
                                }, function (err, res, body) {

                                    var changes_address = {google_data: body};

                                    console.log(body);
                                    var data = body;
                                    if(data && data.results && data.results.length > 0){

                                        var address_google = data.results[0];

                                        local.address.line = address_google.formatted_address;
                                        changes_address.line = address_google.formatted_address;
                                        
                                    }

                                    Address.update(changes_address, {
                                        where: {
                                            id: local.address.id
                                        }
                                    }).then(updatePost => {
                                        console.log("uupdated");

                                        resolve(local);

                                    });

                                });

                            }else{
                                console.log("local completo com google!");

                                resolve(local);
                            }

                        }else{

                            console.log("local completo!");

                            resolve(local);

                        }

                    }else{
                        console.log("sem address!");

                        resolve(local);
                    }
                    

                }else if(filter.info == "2"){
                    //get ig info
                    getLocalIg(local, filter, resolve);
    
                }else if(filter.info == "3"){
                    //get google info
                    //getLocalGoogle(local, filter, resolve);
                    if(local.google_data_scrape == null){
                        console.log("NULO NULO");
                        resolve(null)
                        /*
                        if(local.google_data_scrape_check == false){
                        
                            console.log("go go GOOGLE SCRAPE COMPLETO");
                            if(local.address && local.address.lat && local.address.long){

                                if(local.name && local.name.length > 0){
                                    getLocalGoogle(local, filter, resolve);

                                }else{
                                    console.log("NAO NOME");
                                    resolve(null)
                                }

                            }else{
                                console.log("NAO TEM LAT e LONG");
                                resolve(null)
                            }

                        }else{
                            console.log("NAO ja foi checkado");
                            resolve(null);
                        }*/

                    }else{
                        console.log("done GOOGLE SCRAPE COMPLETO");
                        resolve(local.google_data_scrape);
                    }
                }

            });
        })
    }

    function getLocalIg(local, filter, resolve){
    
        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);
    
            console.log("vai: " + new Date());
            
            console.log("0-1-zap-open | entrando no IG...");
            /*
            await page.goto(`https://www.instagram.com/accounts/login/`, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
    
            await page.waitForSelector('input[name="username"]');
    
            await page.type('input[name="username"]', 'buscapesado');
            await page.type('input[name="password"]', 'Ukx945395');
            await page.click('button[type="submit"]');
    
            //await page.waitForSelector('div[class="COOzN "]');

            await page.waitFor(10000);
            */

            await page.goto(local.origin_url, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
            //await page.waitFor(4000);
            
            var photos = null;

            try{

                await page.waitForSelector('img.FFVAD', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });

                //await page.screenshot({path: 'alocal1.png'});
                
                photos = await page.evaluate(() => {
                    var photos = [];
                    
                    var arr = document.querySelectorAll('img.FFVAD');
                    /*
                    for (let index = 0; index < arr.length; index++) {
                        var p = arr[index];
                        photos.push(p.src);
                    }*/
                    for (let index = arr.length - 1; index >= 0; index--) {
                        var p = arr[index];
                        photos.push(p.src);
                    }

                    return photos;

                });

            }catch(err){
                console.log("ERROR await photso: " + err);
            }  
            

            //console.log(page.url());
    
            browser.close();
            //getStories(filter);
            return photos;
        };
    
        scrape().then((value) => {
            //console.log(value)
            resolve(value);

            if(value && value.length > 0){

                Local.update( {photos: value} , {
                    where: {
                        id: filter.id
                    }
                }).then(updatePost => {
                });

            }

            
        })             
    }

    function getLocalGoogle(local, filter, resolve){
    
        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);
    
            console.log("vai: " + new Date());
            
            console.log("0-1-zap-open | entrando no IG...");

            //var url = 'https://www.google.com/search?q=' + local.name.replace(' ', '+');

            var s_district = arr_districts[local.address.district_id];
            var name_term = formatTerm(local.name);
            if(!name_term.match(s_district)){
                name_term += " " + s_district;
                name_term = formatTerm(name_term);
            }

            var url = "https://www.google.com/maps/search/" + name_term + "/@" + local.address.lat + "," + local.address.long + ",18.14z/data=!3m1!4b1?hl=pt-BR"

            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
            //await page.waitFor(4000);
            //await page.waitForSelector('div[class="COOzN "]');

            //await page.screenshot({path: 'alocal0GGG.png'});

            try{
                await page.waitForSelector('h1.section-hero-header-title-title', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });

            }catch(err){
                console.log("error papi: " + err);
                if(err.message && err.message.match("failed: timeout")){

                    var check_next_page = await page.$('span.n7lv7yjyC35__left');
                    if(check_next_page != null){
                        console.log("É UMA LISTA");   

                        await page.click('h3.section-result-title');

                    }else{
                        console.log("error comportamento estranho: " + page.url());
                        //await page.screenshot({path: 'err-estranho-' + new Date().getTime() + '.png'});
                    }

                }else{
                    console.log("error desconhecido: " + page.url());
                    //await page.screenshot({path: 'err-desconhecido-' + new Date().getTime() + '.png'});
                }
            }

            //await page.screenshot({path: 'alocal1GGG.png'});

            /*
            var check_next_page = await page.$('span.n7lv7yjyC35__left');
            if(check_next_page != null){
                
            }*/

            try{

                await page.waitForSelector('button[data-value="Compartilhar"]', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });
                await page.click('button[data-value="Compartilhar"]');
                await page.waitForSelector('button[data-tooltip="Incorporar um mapa"]', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });
                await page.click('button[data-tooltip="Incorporar um mapa"]');
                

                const local_info = await page.evaluate(() => {
                    var local = {};
                    //address
                    if(document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link')){
                        var address = document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link').innerText;
                        if(address && address.length > 0){
                            local.address = address;
                        }
                    }
                    
                    if(document.querySelector('div[data-tooltip="Expandir horário de funcionamento"] span.section-info-hour-text')){

                        var arr_days = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
                        
                        if(document.querySelector('table.widget-pane-info-open-hours-row-table-hoverable')){
                            var divs_time = document.querySelectorAll('table.widget-pane-info-open-hours-row-table-hoverable tbody tr');
                            if(divs_time && divs_time.length >0){
                                var arr_time = [];
                                for (let index = 0; index < divs_time.length; index++) {
                                    var div_time = divs_time[index];   
                                    //arr_time.push( { day: div_time.querySelectorAll('td')[0].innerHTML, time: div_time.querySelectorAll('td')[1].innerHTML } );
                                    var new_time = { day: div_time.querySelector('th div').innerText.trim(), time: div_time.querySelectorAll('td')[0].querySelector('ul li').innerText, index: arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) + 1 }
                                    arr_time[ arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) ] = new_time;
                                }
                                local.time_work = arr_time;
                            }
                        }

                    }

                    
                    if(document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link')){
                        var phone = document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link').innerText;
                        if(phone && phone.length >0){
                            local.phone = phone;
                        }
                    }

                    
                    if(document.querySelector('div.section-editorial-quote span')){
                        var description = document.querySelector('div.section-editorial-quote span').innerText;
                        if(description && description.length >0){
                            local.description = description;
                        }
                    }

                    if(document.querySelector('input.section-embed-map-input')){
                        var map_embed = document.querySelector('input.section-embed-map-input').value;
                        map_embed = map_embed.substring( map_embed.indexOf('src=') + 5, map_embed.indexOf('" wi') );
                        if(map_embed && map_embed.length >0){
                            local.map_embed = map_embed;
                        }
                    }
                    
                    if(document.querySelector('button[jsaction="pane.rating.category"]')){
                        var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                        if(category && category.length >0){
                            local.category = category;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.rating.category"]')){
                        var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                        if(category && category.length >0){
                            local.category = category;
                        }
                    }

                    if(document.querySelector('span.section-star-display')){
                        var rating_value = document.querySelector('span.section-star-display').innerText;
                        if(rating_value && rating_value.length >0){
                            local.rating_value = rating_value;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.rating.moreReviews"]')){
                        var rating_comments = document.querySelector('button[jsaction="pane.rating.moreReviews"]').innerText;
                        if(rating_comments && rating_comments.length >0){
                            rating_comments = rating_comments.replace("(", "");
                            rating_comments = rating_comments.replace(")", "");
                            local.rating_comments = rating_comments;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                        var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                        if(image_origin && image_origin.length > 0){
                            local.image_origin = image_origin;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                        var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                        if(image_origin && image_origin.length > 0){
                            local.image_origin = image_origin;
                        }
                    }

                    if(JSON.stringify(local) === '{}'){
                        local.empty = true;
                    }

                    return local;
                });

                var origin_google_url = page.url();
                local_info.origin_google_url = origin_google_url;
                console.log(JSON.stringify(local_info));

                if(!local.empty){

                    var local_info_google_en = {};
                    var url_translate = origin_google_url.replace("hl=pt-BR", "hl=en");

                    await page.goto(url_translate, {
                        waitUntil: 'networkidle2',
                        timeout: 3000000
                    });
        
                    try{
                        await page.waitForSelector('h1.section-hero-header-title-title', {
                            waitUntil: 'networkidle2',
                            timeout: 5000
                        });

                        local_info_google_en = await page.evaluate(() => {

                            var local = {};

                            if(document.querySelector('button[jsaction="pane.rating.category"]')){
                                var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                                if(category && category.length >0){
                                    local.category = category;
                                }
                            }

                            if(document.querySelector('div.section-editorial-quote span')){
                                var description = document.querySelector('div.section-editorial-quote span').innerText;
                                if(description && description.length >0){
                                    local.description = description;
                                }
                            }

                            return local;
                        })                                            
        
                    }catch(err){
                        console.log("translate erro step 1: " + err);
                    }

                    if(JSON.stringify(local_info_google_en) !== "{}"){
                        if(local_info_google_en.category){
                            local_info.category_en = local_info_google_en.category;
                        }
                        if(local_info_google_en.description){
                            local_info.description_en = local_info_google_en.description;
                        }
                    }                    

                }

                browser.close();
                //getStories(filter);
                return local_info;

            }catch(err){
                browser.close();
                return null;
            }
           
        };
    
        scrape().then((value) => {
            //console.log(value);

            if(resolve){
                resolve(value);
            }

            if(value){

                Local.update( { google_data_scrape: value, google_data_scrape_check: true  }, {
                    where: {
                        id: local.id
                    }
                }).then(updatePost => {
                    console.log("uupdated");
                });
                
            }else{

                Local.update( { google_data_scrape_check: true  }, {
                    where: {
                        id: local.id
                    }
                }).then(updatePost => {
                    console.log("uupdated TRUE");
                });

            }

            console.log("xau: " + new Date());
        })             
    }

    function getLocalGoogleBk(local, filter, resolve){
    
        const puppeteer = require('puppeteer')

        let scrape = async () => {
            const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
            var page = await browser.newPage()
            const override = Object.assign(page.viewport(), {width: 1366});
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36');
            await page.setViewport(override);
    
            console.log("vai: " + new Date());
            
            console.log("0-1-zap-open | entrando no IG...");

            //var url = 'https://www.google.com/search?q=' + local.name.replace(' ', '+');

            var url = "https://www.google.com/maps/search/" + formatTerm(local.name) + "/@" + local.address.lat + "," + local.address.long + ",18.14z/data=!3m1!4b1?hl=pt-BR"

            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 3000000
            });
            //await page.waitFor(4000);
            //await page.waitForSelector('div[class="COOzN "]');

            //await page.screenshot({path: 'alocal0GGG.png'});

            try{
                await page.waitForSelector('h1.section-hero-header-title', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });

            }catch(err){
                console.log("error papi: " + err);
                if(err.message && err.message.match("failed: timeout")){

                    var check_next_page = await page.$('span.n7lv7yjyC35__left');
                    if(check_next_page != null){
                        console.log("É UMA LISTA");   

                        await page.click('h3.section-result-title');

                    }else{
                        console.log("error comportamento estranho: " + page.url());
                        //await page.screenshot({path: 'err-estranho-' + new Date().getTime() + '.png'});
                    }

                }else{
                    console.log("error desconhecido: " + page.url());
                    //await page.screenshot({path: 'err-desconhecido-' + new Date().getTime() + '.png'});
                }
            }

            //await page.screenshot({path: 'alocal1GGG.png'});

            /*
            var check_next_page = await page.$('span.n7lv7yjyC35__left');
            if(check_next_page != null){
                
            }*/

            try{

                await page.waitForSelector('button[data-value="Compartilhar"]', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });
                await page.click('button[data-value="Compartilhar"]');
                await page.waitForSelector('button[data-tooltip="Incorporar um mapa"]', {
                    waitUntil: 'networkidle2',
                    timeout: 5000
                });
                await page.click('button[data-tooltip="Incorporar um mapa"]');
                

                const local_info = await page.evaluate(() => {
                    var local = {};
                    //address
                    if(document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link')){
                        var address = document.querySelector('div[data-tooltip="Copiar endereço"] span.widget-pane-link').innerText;
                        if(address && address.length > 0){
                            local.address = address;
                        }
                    }
                    
                    if(document.querySelector('div[data-tooltip="Expandir horário de funcionamento"] span.section-info-hour-text')){

                        var arr_days = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
                        
                        if(document.querySelector('table.widget-pane-info-open-hours-row-table-hoverable')){
                            var divs_time = document.querySelectorAll('table.widget-pane-info-open-hours-row-table-hoverable tbody tr');
                            if(divs_time && divs_time.length >0){
                                var arr_time = [];
                                for (let index = 0; index < divs_time.length; index++) {
                                    var div_time = divs_time[index];   
                                    //arr_time.push( { day: div_time.querySelectorAll('td')[0].innerHTML, time: div_time.querySelectorAll('td')[1].innerHTML } );
                                    var new_time = { day: div_time.querySelector('th div').innerText.trim(), time: div_time.querySelectorAll('td')[0].querySelector('ul li').innerText, index: arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) + 1 }
                                    arr_time[ arr_days.indexOf(div_time.querySelector('th div').innerText.trim()) ] = new_time;
                                }
                                local.time_work = arr_time;
                            }
                        }

                    }

                    
                    if(document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link')){
                        var phone = document.querySelector('div[data-tooltip="Copiar número de telefone"] span.widget-pane-link').innerText;
                        if(phone && phone.length >0){
                            local.phone = phone;
                        }
                    }

                    
                    if(document.querySelector('div.section-editorial-quote span')){
                        var description = document.querySelector('div.section-editorial-quote span').innerText;
                        if(description && description.length >0){
                            local.description = description;
                        }
                    }

                    if(document.querySelector('input.section-embed-map-input')){
                        var map_embed = document.querySelector('input.section-embed-map-input').value;
                        map_embed = map_embed.substring( map_embed.indexOf('src=') + 5, map_embed.indexOf('" wi') );
                        if(map_embed && map_embed.length >0){
                            local.map_embed = map_embed;
                        }
                    }
                    
                    if(document.querySelector('button[jsaction="pane.rating.category"]')){
                        var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                        if(category && category.length >0){
                            local.category = category;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.rating.category"]')){
                        var category = document.querySelector('button[jsaction="pane.rating.category"]').innerText;
                        if(category && category.length >0){
                            local.category = category;
                        }
                    }

                    if(document.querySelector('span.section-star-display')){
                        var rating_value = document.querySelector('span.section-star-display').innerText;
                        if(rating_value && rating_value.length >0){
                            local.rating_value = rating_value;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.rating.moreReviews"]')){
                        var rating_comments = document.querySelector('button[jsaction="pane.rating.moreReviews"]').innerText;
                        if(rating_comments && rating_comments.length >0){
                            rating_comments = rating_comments.replace("(", "");
                            rating_comments = rating_comments.replace(")", "");
                            local.rating_comments = rating_comments;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                        var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                        if(image_origin && image_origin.length > 0){
                            local.image_origin = image_origin;
                        }
                    }

                    if(document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img')){
                        var image_origin = document.querySelector('button[jsaction="pane.heroHeader.heroImage"] img').getAttribute("src");;
                        if(image_origin && image_origin.length > 0){
                            local.image_origin = image_origin;
                        }
                    }

                    if(JSON.stringify(local) === '{}'){
                        local.empty = true;
                    }

                    return local;
                });

                var origin_google_url = page.url();
                local_info.origin_google_url = origin_google_url;
                console.log(JSON.stringify(local_info));

                browser.close();
                //getStories(filter);
                return local_info;

            }catch(err){
                browser.close();
                return null;
            }
           
        };
    
        scrape().then((value) => {
            console.log(value)

            if(resolve){
                resolve(value);
            }

            if(value){

                Local.update( { google_data_scrape: value, google_data_scrape_check: true  }, {
                    where: {
                        id: local.id
                    }
                }).then(updatePost => {
                    console.log("uupdated");
                });
                
            }else{

                Local.update( { google_data_scrape_check: true  }, {
                    where: {
                        id: local.id
                    }
                }).then(updatePost => {
                    console.log("uupdated TRUE");
                });

            }

            console.log("xau: " + new Date());
        })             
    }
    
    function getStoriesStatus(filter){
        return new Promise((resolve, reject) => {

            if(filter.city_id){

                Post.findAll({
                    include: [
                        {
                            model: Local,
                            as: "local",
                            attributes: [],
                            include: [
                                {
                                    model: Address,
                                    as: "address",
                                    attributes: [],
                                    where: {
                                        district_id: parseInt(filter.city_id)	
                                    }
                                }
                            ]
                        }
                    ],
                    attributes: ['id', 'created_at'],
                    limit: 5,
                    order: [
                        ['id', 'DESC']
                    ]
                }).then(posts => {
    
                    resolve(posts);
    
                });

            }else{
                
                Post.findAll({
                    attributes: ['id', 'created_at'],
                    limit: 5,
                    order: [
                        ['id', 'DESC']
                    ]
                }).then(posts => {
    
                    resolve(posts);
    
                });
            }

        });
    }
    /*
    function localTranslate(id, params){
        return new Promise((resolve, reject) => {
            
            var resp = {};

            if(params.category){
                
            }

            if(params.description){
                if(translate_s.length > 0){
                    translate_s += "@bb@";
                }
                translate_s += params.description;
            }

            Post.findAll({
                attributes: ['id', 'created_at'],
                limit: 5,
                order: [
                    ['id', 'DESC']
                ]
            }).then(posts => {

                resolve(posts);

            });

        });
    }*/

    function localTranslate(id, params, projectId = 'gobito-1559337734494') {
        return new Promise(async (resolve, reject) => { // <--- this line
          try {

            const {Translate} = require('@google-cloud/translate');
            const translate = new Translate({projectId});
            const target = 'en';
            
            var resp = {};

            if(params.category){
                const [translation_category] = await translate.translate(params.category, target);
                resp.category_en = translation_category;
            }

            if(params.description){
                const [translation_description] = await translate.translate(params.description, target);
                resp.description_en = translation_description;
            }

            resolve(resp);

            Local.findOne({
                attributes: ['id', 'name', 'google_data_scrape'],
                where:{
                    id: id
                }
            }).then(local => {	
                console.log("fera: " + local.name);

                if(local.google_data_scrape){
                    if(resp.category_en){
                        local.google_data_scrape.category_en = resp.category_en;
                    }
                    if(resp.description_en){
                        local.google_data_scrape.description_en = resp.description_en;
                    }
                }
                
                Local.update({google_data_scrape: local.google_data_scrape}, {
                    where: {
                        id: id
                    }
                }).then(updateLocal => {
                });

            });
            

          } catch(error) {
            return reject(error);
          }
        });
    }

    function checkStoriesLocal(id) {

        return new Promise((resolve, reject) => {

            var dd = moment(new Date()).subtract(24, 'hours').toDate();

            Post.count({
                where:{
                    local_id: id,
                    taken_date: {
                        gte: dd
                    }
                }
            }).then(local => {	
                resolve(local);
            });

        })
    }

    function getCategories(id) {

        return new Promise((resolve, reject) => {

            if(id){

                Category.findOne({
                    attributes: ['subcategories'],
                    where:{
                        id: parseInt(id)
                    }
                }).then(categoryData => {	

                    if(categoryData.subcategories){

                        Category.findAll({
                            attributes: ['id', 'name', 'term'],
                            where:{
                                id: {
                                    in: categoryData.subcategories
                                }
                            },
                            order: [
                                ['name', 'ASC']
                            ]
                        }).then(categories => {	
                            resolve(categories);
                        });

                    }else{
                        resolve([]);
                    }
                    
                });

            }else{

                Category.findAll({
                    attributes: ['id', 'name', 'term'],
                    where:{
                        name: {
                            $iLike: {
                                $any: ['Beber', 'Comer', 'Conversar', 'Dançar', 'Passear', 'Ver Outros']
                            }
                        }
                    },
                    order: [
                        ['name', 'ASC']
                    ]
                }).then(categories => {	
                    resolve(categories);
                });
            }

        })
    }

    function getLocalesByName(filter){
		return new Promise((resolve, reject) => {	
            
            var q_aux = formatWord(filter.q);
            var q_arr = q_aux.split(" ");
            /*
            q_arr = q_arr.map(function(w) {
                return "%" + w + "%";
            });*/
            
            var where_query = "";
            q_arr.forEach(w => {
                if(where_query.length > 0){
                    where_query += ",";
                }
                where_query += "'%" + w  + "%'";
            });
            
            console.log(where_query);
            //console.log(where_stament_ss);
            /*
            Local.findAll({
                attributes: ['id', 'name', 'origin_picture_url'],
                where: {
                    name: {
                        $iRegexp: '%tap%|%house%'
                    }
                },
                order: [
                    ['name', 'ASC']
                ],
                limit: 30
            }).then(locales => {	
                resolve(locales);
            });*/

            let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();
            
            var where_stament = "lower(loc.name_term) LIKE ALL (array[" + where_query + "])";
            if(filter.city_id){
                where_stament += " AND ads.district_id = " + filter.city_id;
            }

            if(filter.exclude){
                if(where_stament.length > 0){
                    where_stament += " AND ";
                }
                where_stament += "loc.id NOT IN " + filter.exclude;
            }

            var query_s = 
            "SELECT loc.id, loc.name, loc.origin_picture_url, dis.name as city, google_data_scrape, ads.line " +
            "FROM locales loc " + 
            "INNER JOIN addresses ads on loc.address_id = ads.id " + 
            "INNER JOIN districts dis on ads.district_id = dis.id " + 
            "WHERE " + where_stament + " " +
            "LIMIT 30";
			
			sequelize.query(query_s).spread((result, metadata) => {
				//console.log(JSON.stringify(result));
				console.log(result.length);
				resolve(result);
			});

        })
    }

    function getStoriesStatusUpPhotos(filter){
        return new Promise((resolve, reject) => {

            if(filter.locales){
                
                var query =
                "SELECT loca.id, loca.photos_updated_at, loca.created_at, loca.updated_at " +
                "FROM locales loca " +
                "INNER JOIN addresses ads on loca.address_id = ads.id " + 
                "WHERE ads.district_id IN " + filter.locales + " AND loca.photos_updated_at is not null " +
                "ORDER BY loca.photos_updated_at DESC " + 
                "LIMIT 20";
                Sequelizito.query(query).spread((result, metadata) => {
                    if(result && result.length > 0){

                        resolve(result);

                    }else{
                        resolve([]);
                    }
                });

            }else{
                
                resolve(null);
            }

        });
    }

    function formatTerm (text){       
	    text = text.toLowerCase();                                                         
	    text = text.replace(new RegExp('[ ]','gi'), '+')
	    text = text.replace(new RegExp('[ÁÀÂÃ]','gi'), 'a');
	    text = text.replace(new RegExp('[ÉÈÊ]','gi'), 'e');
	    text = text.replace(new RegExp('[ÍÌÎ]','gi'), 'i');
	    text = text.replace(new RegExp('[ÓÒÔÕ]','gi'), 'o');
	    text = text.replace(new RegExp('[ÚÙÛ]','gi'), 'u');
	    text = text.replace(new RegExp('[Ç]','gi'), 'c');
	    text = text.replace(new RegExp('[Ç]','gi'), 'c');
		text = text.replace(new RegExp('[-]','gi'), '');
		text = text.replace(new RegExp('[(]','gi'), '');
		text = text.replace(new RegExp('[)]','gi'), '');
        text = text.replace(new RegExp('[.]','gi'), '');
        
        if(text.match("Photos and Videos of ")){
            text = text.replace("Photos and Videos of ", "");
        }

	    return text;                 
    }

    function formatWord (text){       
	    text = text.toLowerCase();                     
	    text = text.replace(new RegExp('[ÁÀÂÃ]','gi'), 'a');
	    text = text.replace(new RegExp('[ÉÈÊ]','gi'), 'e');
	    text = text.replace(new RegExp('[ÍÌÎ]','gi'), 'i');
	    text = text.replace(new RegExp('[ÓÒÔÕ]','gi'), 'o');
	    text = text.replace(new RegExp('[ÚÙÛ]','gi'), 'u');
	    text = text.replace(new RegExp('[Ç]','gi'), 'c');
	    text = text.replace(new RegExp('[Ç]','gi'), 'c');
		text = text.replace(new RegExp('[-]','gi'), '');
		text = text.replace(new RegExp('[(]','gi'), '');
		text = text.replace(new RegExp('[)]','gi'), '');
		text = text.replace(new RegExp('[.]','gi'), '');
		text = text.replace(new RegExp('[,]','gi'), '');
		text = text.replace(new RegExp('[/]','gi'), '');
		text = text.replace(new RegExp('[*]','gi'), '');
		text = text.replace(new RegExp('[_]','gi'), '');
	    return text;                 
    }
    
    function updateGoogleDataLocal(id){
        getLocal({info: "3", id: id});
    }

	return {
        getStories,
        changeTextChallenge,
        igLocales,
        getLocales,
        getLocalesA,
        getLocalesTrends,
        getPosts,
        getAllPosts,
        postUpdate,
        getLocal,
        getStoriesStatus,
        localTranslate,
        checkStoriesLocal,
        igLocalPosts,
        getCategories,
        getLocalesByName,
        getStoriesStatusUpPhotos
	};
};
