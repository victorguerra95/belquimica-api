module.exports = function(app) {
	'use strict';

    const Model = require('../models/client');
    const utils = require('../utils/utils')();

    function getClients(req, res, next) {
        
        const model = new Model(app);
		model.getClients(req.firebase_uid, req.query).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

	return {
        getClients
	};
};