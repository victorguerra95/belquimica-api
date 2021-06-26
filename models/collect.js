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
                                        model: Point,
                                        include: [
                                            {
                                                model: Client
                                            }
                                        ]
                                    }
                                ]
                            }).then(collect_data => {
                
                                resolve({code: 200, response: collect_data });

                            });

                        }else{

                            var whereStament = {
                                created_at: {
                                    gte: new Date(filter.dt_from),
                                    lte: new Date(filter.dt_until)
                                }
                            };

                            if(filter.point_id){
                                whereStament.point_id = parseInt(filter.point_id);
                            }
    
                            var off = 0;
                            if(filter.off){
                                off = parseInt(filter.off);
                            }

                            Collect.findAll({
                                where: whereStament,
                                include: [
                                    {
                                        model: Point,
                                        where: {
                                            client_id: parseInt(filter.client_id)
                                        },
                                        include: [
                                            {
                                                model: Client,
                                                as: "client"
                                            }
                                        ]
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

                                    Point.findAll({
                                        where: {
                                            client_id: parseInt(filter.client_id)
                                        }
                                    }).then(points => {

                                        resolve({code: 200, response: { collects: collects, count: count, points: points } });

                                    });

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
                                    point_id: collect_origin.point_id
                                }).then(collectCreated => {	
                                    resolve({code: 200, response: collectCreated });
                                })

                            });

                        }else{

                            let new_collect = {};
                            let parameters_parser_arr = ["collect_date", "analysis_date", "point_id"];
                            parameters_parser_arr.forEach(param => {
                                if(data[param] != null){
                                    new_collect[param] = data[param];
                                }
                            });

                            Point.findOne({
                                where: {
                                    id: new_collect.point_id
                                }
                            }).then(pointData => {	

                                new_collect.collect_data = {
                                    point_data: pointData,
                                    systems: []
                                };

                                pointData.systems.forEach(s => {
                                    new_collect.collect_data.systems.push({
                                        name: s,
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
