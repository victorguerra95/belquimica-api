module.exports = function(app) {
	'use strict';

    const User = app.get('models').User;
    const Client = app.get('models').Client;

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

    function getClients(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        var whereStament = {};
            
                        if(filter.text){

                            var q_arr = filter.text.split(" ");

                            q_arr = q_arr.map(function(q) {
                                return "%" + formatWord(q)  + "%";
                            });

                            whereStament.$or = [
                                {
                                    name_term: {
                                        $iLike: {
                                            $any: q_arr
                                        }
                                    }
                                }
                            ];
                        }

                        var off = 0;
                        if(filter.off){
                            off = parseInt(filter.off);
                        }

                        Client.findAll({
                            where: whereStament,
                            order: [
                                ["name", "ASC"]
                            ],
                            offset: off,
                            limit: 30
                        }).then(clients => {
            
                            Client.count({
                                where: whereStament,
                            }).then(count => {

                                resolve({code: 200, response: { clients: clients, count: count } });

                            });

                        });

                    }else{
                        resolve({code: 500, message: "unexpected_error"});
                    }

                });
                
            } catch (error) {
                resolve({code: 500, message: "unexpected_error"});
            }

        });
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

	return {
        getClients
	};
};
