module.exports = function(app) {
	'use strict';

    const StoriesModel = require('../models/modelExample');
    const utils = require('../utils/utils')();
    
    function getStories(req, res, next) {
        
       const storiesModel = new StoriesModel(app);
       storiesModel.getStories(req.body);
       return res.status(200).json(utils.responseSuccess({message: "Processo iniciado GERAL..."}));
		
    }

	function getStoriesBk(req, res, next) {
        
        //CAMPINAS
        //let filter = {user: "213949389"};

        //SAO PAULO
        let filter = {user: "213163910"};

        //RECIFE
        //let filter = {user: "213762864"};

        //NEW YORK
        //let filter = {user: "212988663"};

        //SAN FRANCISCO
        //let filter = {user: "44961364"};

		if(req.params.user){
			filter.user = req.params.user;
		}
        /*
		const storiesModel = new StoriesModel(app);
		storiesModel.getStories(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);*/

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

        if(req.query.city_id){

            if(req.query.city_id === "2"){
                //SAO PAULO
                const saoPauloModel = new SaoPauloModel(app);
                saoPauloModel.getStories(filter);
                return res.status(200).json(utils.responseSuccess({message: "Processo iniciado SAO PAULO..."}));

            }else if(req.query.city_id === "5"){
                //SAN FRANCISCO
                const sanFranciscoModel = new SanFranciscoModel(app);
                sanFranciscoModel.getStories(filter);
                return res.status(200).json(utils.responseSuccess({message: "Processo iniciado SAN FRANCISCO..."}));

            }else if(req.query.city_id === "7"){
                //MENLO PARK
                const menloParkModel = new MenloParkModel(app);
                menloParkModel.getStories(filter);
                return res.status(200).json(utils.responseSuccess({message: "Processo iniciado MENLO PARK..."}));

            }else if(req.query.city_id === "8"){
                //SAN JOSE
                const sanJoseModel = new SanJoseModel(app);
                sanJoseModel.getStories(filter);
                return res.status(200).json(utils.responseSuccess({message: "Processo iniciado SAN JOSE..."}));

            }else if(req.query.city_id === "9"){
                //DUBAI
                const dubaiModel = new DubaiModel(app);
                dubaiModel.getStories(filter);
                return res.status(200).json(utils.responseSuccess({message: "Processo iniciado DUBAI..."}));

            }else{

                const storiesModel = new StoriesModel(app);
                storiesModel.getStories(filter);
                return res.status(200).json(utils.responseSuccess({message: "Processo iniciado GERAL..."}));    
            }   

        }else{

            const storiesModel = new StoriesModel(app);
            storiesModel.getStories(filter);
            return res.status(200).json(utils.responseSuccess({message: "Processo iniciado GERAL..."}));

        }
		
    }

    function igLocales(req, res, next) {

        const storiesModel = new StoriesModel(app);
		storiesModel.igLocales();
        
        return res.status(200).json(utils.responseSuccess({message: "Processo iniciado VEQ..."}));
		
    }

    function igLocalPosts(req, res, next) {

        const storiesModel = new StoriesModel(app);
		storiesModel.igLocalPosts(req.body);
        
        return res.status(200).json(utils.responseSuccess({message: "Processo iniciado igLocalPosts..."}));
		
    }

    function changeTextChallenge(req, res, next){
        const storiesModel = new StoriesModel(app);
		storiesModel.changeTextChallenge(req.params.text, req.query.id);
        
        return res.status(200).json(utils.responseSuccess({message: "Text challenge trocando..."}));
    }

    function getLocalesA(req, res, next) {

        let filter = {};

        if(req.query.city_id){
            filter.city_id = parseInt(req.query.city_id);
        }

        if(req.query.range_minutes){
            filter.range_minutes = req.query.range_minutes;
        }

        if(req.body.date_start){
            filter.date_start = req.body.date_start;
        }

        if(req.body.date_end){
            filter.date_end = req.body.date_end;
        }

        if(req.query.off){
            filter.off = req.query.off;
        }

        if(req.query.category_id){
            filter.category_id = req.query.category_id;
        }

        if(req.body.exclude){
            filter.exclude = req.body.exclude;
        }

        if(req.query.t){
            filter.t = parseInt(req.query.t);
        }else{
            filter.t = 1;
        }
    
        const storiesModel = new StoriesModel(app);
		storiesModel.getLocalesA(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function getLocales(req, res, next) {

        //if(true){    
        if(req.query.t){    
            console.log("TYPE A");
            getLocalesA(req, res, next);

        }else{

            console.log("TYPE 0");

            let filter = {};

            if(req.query.city_id){
                filter.city_id = req.query.city_id;
            }

            if(req.query.range_minutes){
                filter.range_minutes = req.query.range_minutes;
            }

            if(req.body.date_start){
                filter.date_start = req.body.date_start;
            }

            if(req.body.date_end){
                filter.date_end = req.body.date_end;
            }

            if(req.query.off){
                filter.off = req.query.off;
            }

            if(req.query.category_id){
                filter.category_id = req.query.category_id;
            }

            if(req.body.exclude){
                filter.exclude = JSON.stringify(req.body.exclude);
                filter.exclude = filter.exclude.replace("[", "(").replace("]", ")");
            }

            if(req.query.t){
                filter.t = parseInt(req.query.t);
            }else{
                filter.t = 1;
            }
        
            const storiesModel = new StoriesModel(app);
            storiesModel.getLocales(filter).then(data => {
                return res.status(200).json(utils.responseSuccess(data));
            }).catch(next);

        }
        
    }

    function getLocalesTrends(req, res, next) {

        let filter = {};

        if(req.query.city_id){
            filter.city_id = req.query.city_id;
        }

        if(req.query.range_minutes){
            filter.range_minutes = req.query.range_minutes;
        }

        if(req.body.date_start){
            filter.date_start = req.body.date_start;
        }

        if(req.body.date_end){
            filter.date_end = req.body.date_end;
        }

        if(req.query.off){
            filter.off = req.query.off;
        }

        if(req.query.category_id){
            filter.category_id = req.query.category_id;
        }

        if(req.body.exclude){
            filter.exclude = JSON.stringify(req.body.exclude);
            filter.exclude = filter.exclude.replace("[", "(").replace("]", ")");
        }
    
        const storiesModel = new StoriesModel(app);
		storiesModel.getLocalesTrends(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function getPosts(req, res, next) {

        let filter = {};

        if(req.query.local_id){
            filter.local_id = req.query.local_id;
        }
    
        const storiesModel = new StoriesModel(app);
		storiesModel.getPosts(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function getAllPosts(req, res, next) {

        let filter = {};

        if(req.query.city_id){
            filter.city_id = req.query.city_id;
        }

        if(req.query.range_minutes){
            filter.range_minutes = req.query.range_minutes;
        }
    
        const storiesModel = new StoriesModel(app);
		storiesModel.getAllPosts(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function postUpdate(req, res, next) {

        let changes = req.body;

        console.log(JSON.stringify(req.body));
    
        const storiesModel = new StoriesModel(app);
		storiesModel.postUpdate(changes, req.params.id).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function getLocal(req, res, next) {

        let filter = req.params;
    
        const storiesModel = new StoriesModel(app);
		storiesModel.getLocal(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function getStoriesStatus(req, res, next) {

        var filter = {};
        if(req.query.city_id){
            filter.city_id = req.query.city_id;
        }

        const storiesModel = new StoriesModel(app);
		storiesModel.getStoriesStatus(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
    }

    function localTranslate(req, res, next){

        const storiesModel = new StoriesModel(app);
		storiesModel.localTranslate(req.params.id, req.body).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);

    }

    function checkStoriesLocal(req, res, next){

        const storiesModel = new StoriesModel(app);
		storiesModel.checkStoriesLocal(req.params.id).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);

    }

    function getCategories(req, res, next){

        const storiesModel = new StoriesModel(app);
		storiesModel.getCategories(req.query.id).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);

    }

    function getLocalesByName(req, res, next) {

        let filter = {};

        if(req.query.q){
            filter.q = req.query.q;
        }

        if(req.query.city_id){
            filter.city_id = req.query.city_id;
        }

        if(req.query.range_minutes){
            filter.range_minutes = req.query.range_minutes;
        }

        /*
        if(req.body.date_start){
            filter.date_start = req.body.date_start;
        }

        if(req.body.date_end){
            filter.date_end = req.body.date_end;
        }*/

        if(req.query.off){
            filter.off = req.query.off;
        }

        if(req.query.category_id){
            filter.category_id = req.query.category_id;
        }

        if(req.body.exclude){
            filter.exclude = JSON.stringify(req.body.exclude);
            filter.exclude = filter.exclude.replace("[", "(").replace("]", ")");
        }
    
        const storiesModel = new StoriesModel(app);
		storiesModel.getLocalesByName(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
        
    }

    function getStoriesStatusUpPhotos(req, res, next) {

        var filter = {};
        if(req.body.locales){
            //filter.locales = req.body.locales;
            filter.locales = JSON.stringify(req.body.locales);
            filter.locales = filter.locales.replace("[", "(").replace("]", ")");
        }

        const storiesModel = new StoriesModel(app);
		storiesModel.getStoriesStatusUpPhotos(filter).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
    }

	return {
        getStories,
        changeTextChallenge,
        igLocales,
        getLocales,
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
