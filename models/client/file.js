
module.exports = function(app) {
	'use strict';

    const User = app.get('models').User;
    const Client = app.get('models').Client;
    const Contact = app.get('models').Contact;
    const System = app.get('models').System;
    const ClientSystem = app.get('models').ClientSystem;
    const CollectSystem = app.get('models').CollectSystem;
    const Parameter = app.get('models').Parameter;
    const CollectSystemParameter = app.get('models').CollectSystemParameter;
    const ClientUser = app.get('models').ClientUser;
    const Collect = app.get('models').Collect;
    const File = app.get('models').File;
    const ClientFile = app.get('models').ClientFile;
			
    const Sequelize = require('sequelize');
    const Sequelizito = app.get('sequelize');

	var request = require('request');
	var querystring = require('querystring');
	const Promise = require('promise');
	const config = require('../../config');
	const utils = require('../../utils/utils')();
	const async = require('async');
	const moment = require('moment');
    const _ = require('lodash');

    const http = require('https');

    const admin = require('firebase-admin');

    function getFiles(client_user) {

        return new Promise((resolve, reject) => {

            try {

                File.findAll({
                    where: {
                        processed: true
                    },
                    include: [
                        {
                            model: ClientFile,
                            where: {
                                client_id: client_user.client_id
                            }
                        }
                    ],
                    order: [
                        ["id", "DESC"]
                    ],
                }).then(files => {
    
                    resolve({code: 200, response: files });

                });
                
            } catch (error) {
                resolve({code: 500, message: "unexpected_error"});
            }

        });
    }

	return {
        getFiles
	};
};
