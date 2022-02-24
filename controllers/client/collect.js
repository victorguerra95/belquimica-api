module.exports = function(app) {
	'use strict';

    const Model = require('../../models/client/collect');
    const utils = require('../../utils/utils')();

    function getCollects(req, res, next) {
        
        const model = new Model(app);
		model.getCollects(req.client_user, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

    function getCollectReport(req, res, next) {
        
        const model = new Model(app);
		model.getCollectReport(req.client_user, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

	return {
        getCollects,
        getCollectReport
        
	};
};
