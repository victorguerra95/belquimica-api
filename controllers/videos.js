module.exports = function(app) {
	'use strict';

    const Model = require('../models/videos');
    const utils = require('../utils/utils')();
    
    function createVideo(req, res, next) {
        
        const model = new Model(app);
		model.createVideo(req.body).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
		
    }

    function mediaSign(req, res, next) {
        
        const model = new Model(app);
		model.mediaSign().then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
		
    }

    function mediaUpdate(req, res, next) {
        
        const model = new Model(app);
		model.mediaUpdate(req.params.token, req.body).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
		
    }

    function getMedia(req, res, next) {
        
        const model = new Model(app);
		model.getMedia(req.params.token).then(data => {
			return res.status(200).json(utils.responseSuccess(data));
        }).catch(next);
		
    }

	return {
        createVideo,
        mediaSign,
        mediaUpdate,
        getMedia,
	};
};
