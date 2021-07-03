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
                                    },
                                    {
                                        model: CollectSystem,
                                        include: [
                                            {
                                                model: System
                                            },
                                            {
                                                model: CollectSystemParameter,
                                                include: [
                                                    {
                                                        model: Parameter
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }).then(collect_data => {

                                ClientSystem.findAll({
                                    where: {
                                        client_id: collect_data.client_id
                                    },
                                    include: [
                                        {
                                            model: System
                                        }
                                    ]
                                }).then(client_systems_data => {

                                    resolve({code: 200, response: { collect: collect_data, client_systems: client_systems_data } });

                                });

                            });

                        }else{
                            
                            /*
                            var whereStament = {
                                created_at: {
                                    gte: moment(new Date(filter.dt_from)).format("YYYY-MM-DD") + " 00:00:00.000+00",
                                    lte: moment(new Date(filter.dt_until)).format("YYYY-MM-DD") + " 23:59:59.999+00"
                                }
                            };*/

                            var whereStament = {
                                created_at: {
                                    gte: moment(new Date(filter.dt_from)).subtract(1, 'd').format("YYYY-MM-DD") + " 21:00:00.000+00",
                                    lte: moment(new Date(filter.dt_until)).add(1, 'd').format("YYYY-MM-DD") + " 02:59:59.999+00"
                                }
                            };

                            //console.log("a:"+ JSON.stringify(whereStament));

                            if(filter.client_id){
                                whereStament.client_id = parseInt(filter.client_id);
                            }

                            //{"created_at":{"gte":"2021-06-01T03:00:00.000Z","lte":"2021-07-01T03:00:00.000Z"}}

                            //2021-07-01 20:26:59.731+00
    
                            var off = 0;
                            if(filter.off){
                                off = parseInt(filter.off);
                            }

                            Collect.findAll({
                                where: whereStament,
                                include: [
                                    {
                                        model: Client
                                    },
                                    {
                                        model: CollectSystem,
                                        include: [
                                            {
                                                model: System
                                            },
                                            {
                                                model: CollectSystemParameter,
                                                include: [
                                                    {
                                                        model: Parameter
                                                    }
                                                ]
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

                            let collect_origin_id = parseInt(filter.duplicate_id);
                            let client_destiny_id = parseInt(filter.client_id);

                            Collect.findOne({
                                where: {
                                    id: collect_origin_id
                                },
                                include: [
                                    {
                                        model: Client
                                    },
                                    {
                                        model: CollectSystem,
                                        include: [
                                            {
                                                model: System
                                            },
                                            {
                                                model: CollectSystemParameter,
                                                include: [
                                                    {
                                                        model: Parameter
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }).then(collect_origin => {	

                                Collect.create({
                                }).then(new_collect_created => {	
                                    
                                    //resolve({code: 200, response: collectCreated });

                                    let flow = async () => {
                                        
                                        try {
                                            var error = false;
                                            for (let index = 0; index < collect_origin.collect_systems.length; index++) {
                                                var collect_system_origin = collect_origin.collect_systems[index];
                                                var result = await duplivateCollectSystemParameters(new_collect_created.id, collect_system_origin);
                                                if(result.status == false){
                                                    error = true;
                                                    break;
                                                }
                                            }
                                            
                                            if(!error){

                                                Collect.update({ client_id: client_destiny_id }, {
                                                    where: {
                                                        id: new_collect_created.id
                                                    }
                                                }).then(update_collect => {
                                                    resolve({code: 200, response: new_collect_created });
                                                });
                                                
                                            }else{
                                                resolve({code: 500, message: "unexpected_error"});
                                            }

                                            return error;

                                        } catch (error) {

                                            resolve({code: 500, message: "unexpected_error"});
                                            return false;
                                        }               
                                    }
                                    
                                    flow().then((value) => {
                                        //console.log("duplicate_collect_function_result_error: " + value);
                                    });	

                                });

                                

                            });

                        }else{

                            Collect.create({
                                client_id: parseInt(filter.client_id)
                            }).then(collect_data => {

                                ClientSystem.findAll({
                                    where: {
                                        client_id: parseInt(filter.client_id)
                                    },
                                    include: [
                                        {
                                            model: System
                                        }
                                    ]
                                }).then(systems_data => {	

                                    var collect_systems_bulk_data = systems_data.map(function(s) {
                                        return { 
                                            collect_id: collect_data.id, 
                                            system_id: s.system.id,
                                            input_comments: {
                                                input_technical_advice: null,
                                                input_recommendations: null,
                                                input_dosages: null
                                            }
                                        }
                                    });

                                    CollectSystem.bulkCreate(collect_systems_bulk_data, {
                                        fields: ['collect_id', 'system_id', 'input_comments']
                                    }).then(collect_systems_data => {

                                        Collect.findOne({
                                            where: {
                                                id: collect_data.id
                                            },
                                            include: [
                                                {
                                                    model: Client
                                                },
                                                {
                                                    model: CollectSystem,
                                                    include: [
                                                        {
                                                            model: System
                                                        },
                                                        {
                                                            model: CollectSystemParameter,
                                                            include: [
                                                                {
                                                                    model: Parameter
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }).then(full_collect_data => {	
                                            resolve({code: 200, response: full_collect_data });
                                        });

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

    function duplivateCollectSystemParameters(new_collect_id, collect_system_origin){
        return new Promise(function (resolve, reject) {

            try {


                CollectSystem.create({
                    collect_id: new_collect_id,
                    system_id: collect_system_origin.system_id,
                    input_comments: collect_system_origin.input_comments
                }).then(new_collect_system_created => {	

                    var new_parameters = collect_system_origin.collect_system_parameters.map(function(p) {
                        return {
                            collect_system_id: new_collect_system_created.id,
                            parameter_id: p.parameter_id,
                            unit: p.unit,
                            value: p.value,
                            value_graphic: p.value_graphic,
                            default_value_min: p.default_value_min,
                            default_value_max: p.default_value_max,
                            factor_value_graphic: p.factor_value_graphic,
                        };
                    });

                    CollectSystemParameter.bulkCreate(new_parameters, {
					    fields: ['collect_system_id', 'parameter_id','unit', 'value', 'value_graphic', 'default_value_min', 'default_value_max', 'factor_value_graphic']
				    }).then(new_parameters_created => {
                        resolve({status: true});
                    });

                });

                
            } catch (error) {
                resolve({status: false, error: error});
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
                        let parameters_parser_arr = ["collect_date", "analysis_date", "report_shared"];
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

    function updateParameters(firebase_uid, filter, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        let collect_id = filter.collect_id;
                        let collect_system_id = filter.collect_system_id;
                        let action = filter.action;

                        if(action != "delete"){

                            let name_term = "";
                            let name = "";
                            if(action == "create"){
                                name_term = formatTerm(data.name);
                                name = data.name;
                            }else{
                                name_term = formatTerm(data.parameter.name);
                                name = data.parameter.name;
                            }

                            Parameter.findOrCreate({
                                where: {
                                    name_term: name_term
                                },
                                defaults: {
                                    name: name,
                                    name_term: name_term
                                }
                            }).then(parameter_find_data => {	
                                
                                let parameter_data = JSON.parse(JSON.stringify(parameter_find_data[0]));

                                let new_collect_system_parameter = {
                                    collect_system_id: parseInt(collect_system_id),
                                    parameter_id: parameter_data.id
                                };

                                var parameters_parser_arr = ["unit", "value", "value_graphic", "default_value_min", "default_value_max", "factor_value_graphic"];
                                parameters_parser_arr.forEach(param => {
                                    if(data[param] != null){
                                        new_collect_system_parameter[param] = data[param];
                                    }
                                });

                                if(filter.action == "create"){
                                    CollectSystemParameter.create(new_collect_system_parameter).then(new_collect_system_data => {

                                        CollectSystem.findOne({
                                            where: {
                                                id: parseInt(collect_system_id)
                                            },
                                            include: [
                                                {
                                                    model: System
                                                },
                                                {
                                                    model: CollectSystemParameter,
                                                    include: [
                                                        {
                                                            model: Parameter
                                                        }
                                                    ]
                                                }
                                            ]
                                        }).then(full_collect_system_data => {
            
                                            resolve({ code: 200, response: full_collect_system_data });
            
                                        });

                                    });

                                }else if(filter.action == "update"){

                                    CollectSystemParameter.update(new_collect_system_parameter, {where:  {id: data.id} }).then(itemDataUpdate => {	

                                        CollectSystem.findOne({
                                            where: {
                                                id: parseInt(collect_system_id)
                                            },
                                            include: [
                                                {
                                                    model: System
                                                },
                                                {
                                                    model: CollectSystemParameter,
                                                    include: [
                                                        {
                                                            model: Parameter
                                                        }
                                                    ]
                                                }
                                            ]
                                        }).then(full_collect_system_data => {
            
                                            resolve({ code: 200, response: full_collect_system_data });
            
                                        });

                                    });
                                }
                                
                            });

                        }else{

                            CollectSystemParameter.destroy({
                                force: true,
                                where: {
                                    id: data.id
                                }
                            }).then(destroyData => {
                                CollectSystem.findOne({
                                    where: {
                                        id: parseInt(collect_system_id)
                                    },
                                    include: [
                                        {
                                            model: System
                                        },
                                        {
                                            model: CollectSystemParameter,
                                            include: [
                                                {
                                                    model: Parameter
                                                }
                                            ]
                                        }
                                    ]
                                }).then(full_collect_system_data => {
    
                                    resolve({ code: 200, response: full_collect_system_data });
    
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

    function updateSystems(firebase_uid, filter, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        let collect_id = parseInt(filter.collect_id);
                        let action = filter.action;

                        if(action == "create"){

                            let system_id = data.system_id;

                            let new_collect_system = { 
                                collect_id: collect_id,
                                system_id: system_id,
                                input_comments: {
                                    input_technical_advice: null,
                                    input_recommendations: null,
                                    input_dosages: null
                                }
                            };

                            CollectSystem.create(new_collect_system).then(collect_system_created_data => {	
                                CollectSystem.findOne({
                                    where: {
                                        id: collect_system_created_data.id
                                    },
                                    include: [
                                        {
                                            model: System
                                        },
                                        {
                                            model: CollectSystemParameter,
                                            include: [
                                                {
                                                    model: Parameter
                                                }
                                            ]
                                        }
                                    ]
                                }).then(full_collect_system_created_data => {
                                    resolve({ code: 200, response: full_collect_system_created_data });
                                });
                            });

                        }else if(action == "delete"){

                            let collect_system_id = data.collect_system_id;

                            CollectSystem.destroy({
                                force: true,
                                where: {
                                    id: collect_system_id
                                }
                            }).then(destroyData => {
                                resolve({ code: 200, response: true });
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

    function updateCollectSystem(firebase_uid, filter, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        let collect_system_id = parseInt(filter.collect_system_id);

                        let data_to_update = {};

                        var parameters_parser_arr = ["input_comments"];
                        parameters_parser_arr.forEach(param => {
                            if(data[param] != null){
                                data_to_update[param] = data[param];
                            }
                        });

                        CollectSystem.update(data_to_update, {where:  {id: collect_system_id} }).then(itemDataUpdate => {	

                            CollectSystem.findOne({
                                where: {
                                    id: collect_system_id
                                },
                                include: [
                                    {
                                        model: System
                                    },
                                    {
                                        model: CollectSystemParameter,
                                        include: [
                                            {
                                                model: Parameter
                                            }
                                        ]
                                    }
                                ]
                            }).then(full_collect_system_data => {

                                resolve({ code: 200, response: full_collect_system_data });

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

    function formatTerm (text){       
	    text = text.toLowerCase();                     
        text = text.replace(new RegExp('[ ]','gi'), '');
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
        getCollects,
        getPoints,
        createCollect,
        updateCollect,
        deleteCollect,
        updateParameters,
        updateSystems,
        updateCollectSystem
	};
};
