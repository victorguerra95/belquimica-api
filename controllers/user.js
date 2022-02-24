module.exports = function(app) {
	'use strict';

    const Model = require('../models/user');
    const utils = require('../utils/utils')();

    function getUserStatus(req, res, next) {
        
        const model = new Model(app);
		model.getUserStatus(req.user).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

	return {
        getUserStatus
        
	};
};
