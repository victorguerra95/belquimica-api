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

    function getCollects(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){
                        
                        if(filter.collect_id){

                            Collect.findOne({
                                where: {
                                    id: filter.collect_id
                                },
                                include: [
                                    {
                                        model: Client
                                    }
                                ]
                            }).then(collect_data => {

                                Point.findAll({
                                    where: {
                                        client_id: collect_data.client_id
                                    }
                                }).then(points_data => {

                                    resolve({code: 200, response: { collect: collect_data, points: points_data } });

                                });

                            });

                        }else{

                            var whereStament = {
                                created_at: {
                                    gte: new Date(filter.dt_from),
                                    lte: new Date(filter.dt_until)
                                }
                            };

                            if(filter.client_id){
                                whereStament.client_id = parseInt(filter.client_id);
                            }
    
                            var off = 0;
                            if(filter.off){
                                off = parseInt(filter.off);
                            }

                            Collect.findAll({
                                where: whereStament,
                                include: [
                                    {
                                        model: Client,
                                        as: "client",
                                    }
                                ],
                                order: [
                                    ["id", "DESC"]
                                ],
                                offset: off,
                                //limit: 30,
                            }).then(collects => {
                
                                Collect.count({
                                    where: whereStament,
                                }).then(count => {

                                    resolve({code: 200, response: { collects: collects, count: count } });

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

    function getPoints(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){
                        
                        Point.findAll({
                            where: {
                                client_id: parseInt(filter.client_id)
                            },
                            order: [
                                ["id", "ASC"]
                            ]
                        }).then(points => {
            
                            resolve({ code: 200, response: points });

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

    function createCollect(firebase_uid, data, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        if(filter.duplicate_id){

                            Collect.findOne({
                                where: {
                                    id: filter.duplicate_id
                                }
                            }).then(collect_origin => {	

                                Collect.create({
                                    collect_data: collect_origin.collect_data,
                                    client_id: collect_origin.client_id
                                }).then(collectCreated => {	
                                    resolve({code: 200, response: collectCreated });
                                })

                            });

                        }else{

                            let new_collect = {
                                client_id: filter.client_id
                            };

                            Point.findAll({
                                where: {
                                    client_id: new_collect.client_id
                                }
                            }).then(pointsData => {	

                                new_collect.collect_data = {
                                    systems: []
                                };

                                pointsData.forEach(s => {
                                    new_collect.collect_data.systems.push({
                                        id: s.id,
                                        name: s.name,
                                        inputs: [],
                                        input_technical_advice: null,
                                        input_recommendations: null,
                                        input_dosages : null 
                                    });
                                });

                                Collect.create(new_collect).then(collect_data => {
                                    resolve({code: 200, response: collect_data });
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

    function updateCollect(firebase_uid, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        let collect_data_to_update = {};
                        let parameters_parser_arr = ["collect_date", "analysis_date", "collect_data"];
                        parameters_parser_arr.forEach(param => {
                            if(data[param] != null){
                                collect_data_to_update[param] = data[param];
                            }
                        });

                        Collect.update(collect_data_to_update, {where:  {id: data.id} }).then(itemDataUpdate => {	
                            resolve({code: 200, response: true});
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

    function deleteCollect(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        if(filter.collect_id){

                            Collect.destroy({
                                where: {
                                    id: filter.collect_id
                                },
                                force: true
                            }).then(removeData => {	

                                resolve({ code: 200, response: removeData });

                            });


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

	return {
        getCollects,
        getPoints,
        createCollect,
        updateCollect,
        deleteCollect
	};
};
