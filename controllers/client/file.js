module.exports = function(app) {
	'use strict';

    const Model = require('../../models/client/file');
    const utils = require('../../utils/utils')();

    function getFiles(req, res, next) {
        
        const model = new Model(app);
		model.getFiles(req.client_user).then(data => {

            if(data.code == 200){
                return res.status(data.code).json(utils.responseSuccess(data.response));
            }else{
                return res.status(data.code).json(utils.responseError(data));
            }

        }).catch(next);
		
    }

	return {
        getFiles
        
	};
};
