module.exports = function(app) {
	'use strict';

    const User = app.get('models').User;
    const Client = app.get('models').Client;
    const Contact = app.get('models').Contact;
    const Point = app.get('models').Point;
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

    function getClients(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){
                        
                        if(filter.client_id){

                            Client.findOne({
                                where: {
                                    id: filter.client_id
                                },
                                include: [
                                    {
                                        model: Contact
                                    },
                                    {
                                        model: Point
                                    },
                                    {
                                        model: ClientUser
                                    }
                                ]
                            }).then(client_data => {
                
                                resolve({code: 200, response: client_data });

                            });

                        }else{

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

                        }

                    }else{
                        resolve({code: 500, message: "unexpected_error"});
                    }

                });
                
            } catch (error) {
                resolve({code: 500, message: "unexpected_error"});
            }

        });
    }

    function createClient(firebase_uid, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        let new_client = {};
                        let parameters_parser_arr = ["name", "doc", "state", "city", "address"];
                        parameters_parser_arr.forEach(param => {
                            if(data[param] != null){
                                new_client[param] = data[param];
                            }
                        });

                        Client.create(new_client).then(client_data => {
                            resolve({code: 200, response: client_data });
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

    function updateClient(firebase_uid, filter, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        if(filter.data != null && filter.action != null && filter.client_id != null){

                            if(filter.data == "basic"){

                                let data_to_update = {};
                                let parameters_parser_arr = ["name", "doc", "state", "city", "address"];
                                parameters_parser_arr.forEach(param => {
                                    if(data[param] != null){
                                        data_to_update[param] = data[param];
                                    }
                                });

                                Client.update(data_to_update, {where:  {id: filter.client_id} }).then(itemDataUpdate => {	
                                    resolve({code: 200, response: true});
                                });

                            }else if(filter.data == "contact"){
                                //create
                                //edit
                                //delete

                                if(filter.action == "delete"){
                                }else{

                                    let contact_data = { client_id: filter.client_id };
                                    let parameters_parser_arr = ["name", "email", "sector"];
                                    parameters_parser_arr.forEach(param => {
                                        if(data[param] != null){
                                            contact_data[param] = data[param];
                                        }
                                    });

                                    if(filter.action == "create"){
                                        Contact.create(contact_data).then(data_created => {
                                            Client.findOne({
                                                where: {
                                                    id: filter.client_id
                                                },
                                                include: [
                                                    {
                                                        model: Contact
                                                    },
                                                    {
                                                        model: Point
                                                    },
                                                    {
                                                        model: ClientUser
                                                    }
                                                ]
                                            }).then(client_result => {
                                                resolve({ code: 200, response: client_result });
                                            });
                                        });
                                    }else if(filter.action == "update"){
                                        Contact.update(contact_data, {where:  {id: data.id} }).then(itemDataUpdate => {	
                                            Client.findOne({
                                                where: {
                                                    id: filter.client_id
                                                },
                                                include: [
                                                    {
                                                        model: Contact
                                                    },
                                                    {
                                                        model: Point
                                                    },
                                                    {
                                                        model: ClientUser
                                                    }
                                                ]
                                            }).then(client_result => {
                                                resolve({ code: 200, response: client_result });
                                            });
                                        });
                                    }
                                }

                            }else if(filter.data == "point"){
                                //create
                                //edit
                                //delete
                            }else if(filter.data == "user"){
                                //create
                                //edit
                                //delete
                            }
                            

                        }else{
                            resolve({code: 500, message: "unexpected_error"});
                        }

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
        getClients,
        createClient,
        updateClient
	};
};
