
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
			
    const Sequelize = require('sequelize');
    const Sequelizito = app.get('sequelize');

	var request = require('request');
	var querystring = require('querystring');
	const Promise = require('promise');
	const config = require('../config');
	const utils = require('../utils/utils')();
	const async = require('async');
	const moment = require('moment');
    const _ = require('lodash');

    const http = require('https');

    const admin = require('firebase-admin');

    function getUserStatus(user) {

        return new Promise((resolve, reject) => {

            try {

                resolve({code: 200, response: user});
                
            } catch (error) {
                resolve({code: 500, message: "unexpected_error"});
            }

        });
    }

	return {
        getUserStatus
	};
};
