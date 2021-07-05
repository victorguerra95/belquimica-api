module.exports = function(app) {
	'use strict';

    const Model = require('../models/collect');
    const utils = require('../utils/utils')();

    function getCollects(req, res, next) {
        
        const model = new Model(app);
		model.getCollects(req.firebase_uid, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function getCollectReport(req, res, next) {
        
        const model = new Model(app);
		model.getCollectReport(req.firebase_uid, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function getPoints(req, res, next) {
        
        const model = new Model(app);
		model.getPoints(req.firebase_uid, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function createCollect(req, res, next) {
        
        const model = new Model(app);
		model.createCollect(req.firebase_uid, req.body, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function updateCollect(req, res, next) {
        
        const model = new Model(app);
		model.updateCollect(req.firebase_uid, req.body).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function deleteCollect(req, res, next) {
        
        const model = new Model(app);
		model.deleteCollect(req.firebase_uid, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function updateParameters(req, res, next) {
        
        const model = new Model(app);
		model.updateParameters(req.firebase_uid, req.query, req.body).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function updateSystems(req, res, next) {
        
        const model = new Model(app);
		model.updateSystems(req.firebase_uid, req.query, req.body).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function updateCollectSystem(req, res, next) {
        
        const model = new Model(app);
		model.updateCollectSystem(req.firebase_uid, req.query, req.body).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

	return {
        getCollects,
        getPoints,
        createCollect,
        updateCollect,
        deleteCollect,
        updateParameters,
        updateSystems,
        updateCollectSystem,
        getCollectReport
	};
};
