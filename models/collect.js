
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
                                        ],
                                    }
                                ],
                                order: [
                                    [ CollectSystem, 'index', 'ASC' ],
                                    [ CollectSystem, CollectSystemParameter, 'index', 'ASC' ]
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

                            var whereStament = {}

                            if(filter.dt_from != null || filter.dt_from != null){
                                whereStament.$or = [
                                    {
                                        collect_date: {}
                                    },
                                    {
                                        collect_date: null
                                    }
                                ];

                                console.log(JSON.stringify(whereStament));

                                if(filter.dt_from != null){
                                    whereStament.$or[0].collect_date.gte = moment(new Date(filter.dt_from)).subtract(1, 'd').format("YYYY-MM-DD") + " 21:00:00.000+00";
                                }

                                if(filter.dt_until != null){
                                    whereStament.$or[0].collect_date.lte = moment(new Date(filter.dt_until)).add(1, 'd').format("YYYY-MM-DD") + " 02:59:59.999+00";
                                }
                            }

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
                                    ["id", "DESC"],
                                    [ CollectSystem, 'id', 'ASC' ]
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

    function getCollectReport(firebase_uid, filter) {

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
                                ],
                                order: [
                                    [ CollectSystem, 'index', 'ASC' ],
                                    [ CollectSystem, CollectSystemParameter, 'index', 'ASC' ]
                                ]
                            }).then(collect_data => {

                                let collect_data_edit = JSON.parse(JSON.stringify(collect_data));

                                let flow = async () => {
											
                                    try {
                                        var error = false;
                                        //for (let index = 0; index < mock_data.systems.length; index++) {
                                        for (let index = 0; index < collect_data_edit.collect_systems.length; index++) {
                                            var collect_system = collect_data_edit.collect_systems[index];
                                            
                                            for (let index_parameter = 0; index_parameter < collect_system.collect_system_parameters.length; index_parameter++) {
                                                let cs_parameter_c = collect_system.collect_system_parameters[index_parameter];

                                                if(cs_parameter_c.chart_show == true){
                                                    var result = await getDataReportForSystemParameter(cs_parameter_c, collect_data_edit, collect_system);
                                                    if(result.status == false){
                                                        error = true;
                                                        break;
                                                    }else{

                                                        if(collect_data_edit.collect_systems[index].data_report == null){
                                                            collect_data_edit.collect_systems[index].data_report = [];
                                                        }
                                                        let new_data_report = JSON.parse(JSON.stringify(cs_parameter_c.parameter));
                                                        new_data_report.collect_system_parameters = JSON.parse(JSON.stringify(result.data));
                                                        collect_data_edit.collect_systems[index].data_report.push(new_data_report);
                                                    }
                                                }
                                                
                                            }

                                            if(!error){
                                                var parameters_legnth = collect_data_edit.collect_systems[index].data_report.length;
                                                var calc_pages = parameters_legnth / 5;
                                                var round_calc_pages = Math.round(calc_pages);
                                                var pages = round_calc_pages;
                                                if(calc_pages > round_calc_pages){
                                                    pages++;
                                                }

                                                collect_data_edit.collect_systems[index].pages = new Array(pages);
                                            }

                                            
                                        }
                                        
                                        if(!error){

                                            resolve({code: 200, response: { collect: collect_data_edit, data_report: collect_data_edit.collect_systems[0].data_report } });
                                            
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
                                    console.log("getCollectReport: " + value);
                                });	
                                
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

    function getDataReportForSystemParameter(cs_parameter_data, collect_data, collect_system){
        return new Promise(function (resolve, reject) {

            try {
                console.log("collect_data.collect_date: " + collect_data.collect_date);
                CollectSystemParameter.findAll({
                    where: {
                        parameter_id: cs_parameter_data.parameter_id
                    },
                    include: [
                        {
                            model: CollectSystem,
                            where: {
                                system_id: collect_system.system_id
                            },
                            include : [
                                {
                                    model: Collect,
                                    where: {
                                        client_id: collect_data.client_id,
                                        collect_date: {
                                            not: null,
                                            lte: collect_data.collect_date
                                        }
                                    }
                                }
                            ]
                        }
                    ],
                    limit: 13,
                    order: [
                        //[ 'id', 'ASC' ],
                        [ CollectSystem, Collect, 'collect_date', 'DESC' ]
                    ]
                }).then(data => {
                    resolve({ status: true, data: data });
    
                });

                
            } catch (error) {
                resolve({status: false, error: error});
            }
        });
    }

    function getDataReportForSystem(collect_data, collect_system){
        return new Promise(function (resolve, reject) {

            try {

                let report_graph = collect_system.collect_system_parameters.map(function(csp) {
                    return csp.parameter.id;
                });
                /*
                CollectSystemParameter.findAll({
                    where: {
                        parameter_id: {
                            in: report_graph
                        }
                    },
                    include: [
                        {
                            model: CollectSystem,
                            where: {
                                system_id: collect_system.system_id
                            },
                            include : [
                                {
                                    model: Collect,
                                    where: {
                                        client_id: collect_data.client_id,
                                        collect_date: {
                                            not: null
                                        }
                                    },
                                }
                            ]
                        }
                    ],
                    order: [
                        [ 'id', 'ASC' ],
                        [ CollectSystem, Collect, 'collect_date', 'ASC' ]
                    ]
                }).then(data_report => {

                    resolve({status: true, data_report: data_report });

                });*/

                console.log("report_graph: " + JSON.stringify(report_graph));
                console.log("system_id: " + collect_system.system_id);
                console.log("collect_data.client_id: " + collect_data.client_id);
                
                Parameter.findAll({
                    where: {
                        id: report_graph
                    },
                    include: [
                        {
                            model: CollectSystemParameter,
                            include : [
                                {
                                    model: CollectSystem,
                                    where: {
                                        system_id: collect_system.system_id
                                    },
                                    include : [
                                        {
                                            model: Collect,
                                            where: {
                                                client_id: collect_data.client_id,
                                                collect_date: {
                                                    not: null
                                                }
                                            },
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    order: [
                        //[ 'id', 'ASC' ],
                        [ CollectSystemParameter, CollectSystem, Collect, 'collect_date', 'ASC' ]
                    ]
                }).then(data_report => {

                    let data_report_id_indeces = data_report.map(function(data) {
                        return data.id;
                    });

                    var data_report_ordered = [];
                    report_graph.forEach(id => {
                        var index_target = data_report_id_indeces.indexOf(id);
                        data_report_ordered.push(data_report[index_target]);
                    });

                    resolve({ status: true, data_report: data_report_ordered });

                });

                
            } catch (error) {
                resolve({status: false, error: error});
            }
        });
    }

    function getCollectReportBk(firebase_uid, filter) {

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

                                let report_graph = collect_data.collect_systems[0].collect_system_parameters.map(function(csp) {
                                    return csp.parameter.id;
                                });
                                //console.log(JSON.stringify(report_graph));

                                Parameter.findAll({
                                    where: {
                                        id: {
                                            in: report_graph
                                        }
                                    },
                                    include: [
                                        {
                                            model: CollectSystemParameter,
                                            include : [
                                                {
                                                    model: CollectSystem,
                                                    where: {
                                                        system_id: collect_data.collect_systems[0].system_id
                                                    },
                                                    include : [
                                                        {
                                                            model: Collect,
                                                            where: {
                                                                client_id: collect_data.client_id
                                                            }
                                                        }
                                                    ]
                                                }
                                            ],
                                            //limit: 2
                                        }
                                    ],
                                    order: [
                                        [ 'id', 'DESC' ]
                                    ]
                                }).then(data_report => {
                                    
                                    resolve({code: 200, response: { collect: collect_data, data_report: data_report } });

                                });
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
                                ],
                                order: [
                                    [ CollectSystem, 'index', 'ASC' ],
                                    [ CollectSystem, CollectSystemParameter, 'index', 'ASC' ]
                                ]
                            }).then(collect_origin => {	

                                Collect.create({
                                    chart_show: collect_origin.chart_show
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
                    input_comments: collect_system_origin.input_comments,
                    index: collect_system_origin.index
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
					    fields: ['collect_system_id', 'parameter_id','unit', 'value', 'value_graphic', 'default_value_min', 'default_value_max', 'factor_value_graphic', 'index', 'chart_show']
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
                        let parameters_parser_arr = ["collect_date", "analysis_date", "report_shared", "chart_show"];
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

                        Collect.findOne({
                            where: {
                                id: data.id
                            },
                            include: [
                                {
                                    model: CollectSystem,
                                    attributes: ['id'],
                                    include: [
                                        {
                                            model: System,
                                            attributes: []
                                        },
                                        {
                                            model: CollectSystemParameter,
                                            include: [
                                                {
                                                    model: Parameter,
                                                    attributes: ['id'],
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }).then(collect_found => {	

                            if(collect_found != null){
                                /*
                                let collect_systems_parameters_current_ids = collect_found;
                                array.forEach(element => {
                                    
                                });*/

                                let collect_data_to_update = {};
                                let parameters_parser_arr = ["collect_date", "analysis_date", "report_shared", "chart_show"];
                                parameters_parser_arr.forEach(param => {
                                    if(data[param] != null){
                                        collect_data_to_update[param] = data[param];
                                    }
                                });

                                Collect.update(collect_data_to_update, {where:  {id: collect_found.id} }).then(itemDataUpdate => {	
                                    
                                    console.log("collect_found");

                                    let flow = async () => {
                                            
                                        try {
                                            let new_parameters = []; 
                                            let error = false;
                                            for (let collect_system_index = 0; collect_system_index < data.collect_systems.length; collect_system_index++) {

                                                let collect_system = data.collect_systems[collect_system_index];
                                                let result_cs_update = await updateCollectSystemAsync(collect_system);
                                                if(result_cs_update.status == false){
                                                    error = true;
                                                    break;
                                                }

                                                for (let system_parameter_index = 0; system_parameter_index < collect_system.collect_system_parameters.length; system_parameter_index++) {
                                                    
                                                    let system_parameter = collect_system.collect_system_parameters[system_parameter_index];
                                                    system_parameter["index"] = system_parameter_index;

                                                    let result = await createNewCollectSystemParameter(collect_system.id, system_parameter);
                                                    if(result.status == false){
                                                        error = true;
                                                        break;
                                                    }else{
                                                        new_parameters.push(result.new_collect_system_parameter);
                                                    }

                                                }

                                            }
                                            
                                            if(!error){

                                                let collect_systems_parameters_current_ids = [];
                                                collect_found.collect_systems.forEach(cs => {
                                                    let parameters_id = cs.collect_system_parameters.map(function(csp) {
                                                        return csp.id;
                                                    });
                                                    collect_systems_parameters_current_ids = collect_systems_parameters_current_ids.concat(parameters_id);
                                                });
                                                
                                                CollectSystemParameter.destroy({
                                                    force: true,
                                                    where: {
                                                        id: {
                                                            in: collect_systems_parameters_current_ids
                                                        }
                                                    }
                                                }).then(destroy_data => {

                                                    console.log("destroy_data: " + JSON.stringify(destroy_data));

                                                    CollectSystemParameter.bulkCreate(new_parameters, {
                                                        fields: ["collect_system_id", "parameter_id", "unit", "value", "value_graphic", "default_value_min", "default_value_max", "factor_value_graphic", "index", "chart_show"]
                                                    }).then(collect_system_parameters_data => {

                                                        console.log("bulk");
                                                        //console.log(JSON.stringify(collect_system_parameters_data));
                                                        
                                                        resolve({code: 200, response: true });
                
                                                    }).catch(function(err) {
                                                        // print the error details
                                                        console.log("updateParameters | CollectSystemParameter.bulkCreate: " + err);
                                                        resolve({code: 500, message: "unexpected_error"});
                                                    });

                                                    

                                                }).catch(function(err) {
                                                    // print the error details
                                                    console.log("updateParameters | CollectSystemParameter.destroy: " + err);
                                                    resolve({code: 500, message: "unexpected_error"});
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
                                        console.log("updateParameters: " + value);
                                    });	


                                });

                            }else{
                                resolve({code: 500, message: "unexpected_error"});
                            }

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

    function updateCollectSystemAsync(collect_system){
        return new Promise(function (resolve, reject) {

            try {
                
                let data_to_update = { input_comments: collect_system.input_comments };

                CollectSystem.update(data_to_update, {where:  {id: collect_system.id } }).then(itemDataUpdate => {	

                    resolve({status: true});

                }).catch(function(err) {
                    // print the error details
                    console.log("updateCollectSystem: " + err);
                    resolve({status: false, error: error});
                });
                
            } catch (error) {
                resolve({status: false, error: error});
            }

        });
    }

    function createNewCollectSystemParameter(collect_system_id, collect_system_parameter_data){
        return new Promise(function (resolve, reject) {

            try {

                let name = collect_system_parameter_data.parameter.name;
                let name_term = formatTerm(name);

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
                        collect_system_id: collect_system_id,
                        parameter_id: parameter_data.id
                    };

                    var parameters_parser_arr = ["unit", "value", "value_graphic", "default_value_min", "default_value_max", "factor_value_graphic", "index", "chart_show"];
                    parameters_parser_arr.forEach(param => {
                        if(collect_system_parameter_data[param] != null){
                            new_collect_system_parameter[param] = collect_system_parameter_data[param];
                        }
                    });

                    resolve({status: true, new_collect_system_parameter: new_collect_system_parameter});
                    
                }).catch(function(err) {
                    // print the error details
                    console.log("createNewCollectSystemParameter: " + err);
                    resolve({status: false, error: error});
                });

                
            } catch (error) {
                resolve({status: false, error: error});
            }
        });
    }

    function updateParameters2(firebase_uid, filter, data) {

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
                                index: data.index,
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


                                Collect.findOne({
                                    where: {
                                        id: collect_id
                                    },
                                    include: [
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
                                                    ],
                                                }
                                            ]
                                        }
                                    ],
                                    order: [
                                        [ CollectSystem, 'index', 'ASC' ],
                                        [ CollectSystem, CollectSystemParameter, 'index', 'ASC' ]
                                    ]
                                }).then(collect => {	

                                    let flow = async () => {
        
                                        try {
                
                                            for (let index_system = 0; index_system < collect.collect_systems.length; index_system++) {
            
                                                let collect_system = collect.collect_systems[index_system];
            
                                                var result_update_collect_system = await updateCollectSystemOrderAsync(collect_system.id, { "index": index_system } );
                                                console.log("result_update_collect_system: " + JSON.stringify(result_update_collect_system));
                                                if(result_update_collect_system.is_ok == false){
                                                    throw "error index collect_system i " + index_system + " id " + collect_system.id + " collect id " + collect.id;
                                                }
            
                                                resolve({ code: 200, response: true });
            
                                            }
                
                                        } catch (error) {
                                            
                                            console.log("ERROR FLOW scriptInsertCollectSystemsIndex: " + error);
                                            resolve({code: 500, message: "unexpected_error"});
                
                                        }
            
                                        return true;
                                    }
                                    
                                    flow().then((value) => {
                                        console.log("scriptInsertCollectSystemsIndex: " + value);
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

    function updateCollectSystemOrder(firebase_uid, filter, data) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        let collect_id = parseInt(filter.collect_id);

                        let flow = async () => {
        
                            try {
    
                                for (let index_system = 0; index_system < data.collect_systems.length; index_system++) {

                                    let collect_system = data.collect_systems[index_system];

                                    var result_update_collect_system = await updateCollectSystemOrderAsync(collect_system.id, { "index": index_system } );
                                    console.log("result_update_collect_system: " + JSON.stringify(result_update_collect_system));
                                    if(result_update_collect_system.is_ok == false){
                                        throw "error index collect_system i " + index_system + " id " + collect_system.id + " collect id " + collect.id;
                                    }

                                    resolve({ code: 200, response: true });

                                }
    
                            } catch (error) {
                                
                                console.log("ERROR FLOW scriptInsertCollectSystemsIndex: " + error);
                                resolve({code: 500, message: "unexpected_error"});
    
                            }

                            return true;
                        }
                        
                        flow().then((value) => {
                            console.log("scriptInsertCollectSystemsIndex: " + value);
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

    function updateCollectSystemOrderAsync(collect_system_id, changes){
        return new Promise(function (resolve, reject) {

            try {

                CollectSystem.update(changes, {
                    where: {
                        id: collect_system_id
                    }
                }).then(collect_system_update => {
                    resolve({is_ok: true });
                });

                
            } catch (error) {
                resolve({is_ok: false, error: error});
            }
        });
    }

    function duplicateCollectSystem(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null && filter.origin_id != null && filter.destiny_id != null){

                        CollectSystem.findOne({
                            where: {
                                id: parseInt(filter.origin_id)
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
                            ],
                            order: [
                                [ CollectSystemParameter, 'index', 'ASC' ]
                            ]
                        }).then(full_collect_system_data => {

                            if(full_collect_system_data != null){

                                let data_to_create_collect_system = { system_id: filter.destiny_id, index: filter.index };
                                let parameters_parser_arr = ["collect_id", "input_comments"];
                                parameters_parser_arr.forEach(param => {
                                    if(full_collect_system_data[param] != null){
                                        data_to_create_collect_system[param] = full_collect_system_data[param];
                                    }
                                });

                                CollectSystem.create(data_to_create_collect_system).then(new_collect_system_data => {

                                    /*
                                    let parameters_new = full_collect_system_data.collect_system_parameters.map(function(csp) {
                                        delete csp.createdAt;
                                        delete csp.updatedAt;
                                        delete csp.id;
                                        csp.collect_system_id = new_collect_system_data.id;
                                        return csp;
                                    });*/
                                    let parameters_new = [];
                                    for (let index_copy_parameter = 0; index_copy_parameter <  full_collect_system_data.collect_system_parameters.length; index_copy_parameter++) {
                                        let param =  JSON.parse(JSON.stringify(full_collect_system_data.collect_system_parameters[index_copy_parameter]));
                                        delete param.createdAt;
                                        delete param.updatedAt;
                                        delete param.id;
                                        param.collect_system_id = new_collect_system_data.id;
                                        parameters_new.push(param);
                                    }

                                    CollectSystemParameter.bulkCreate(parameters_new, {
                                        fields: ['collect_system_id', 'parameter_id', 'unit', 'value', 'value_graphic', 'default_value_min', 'default_value_max', 'factor_value_graphic', 'index', 'chart_show']
                                    }).then(collect_system_parameter_created_data => {

                                        CollectSystem.findOne({
                                            where: {
                                                id: new_collect_system_data.id
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
                                            ],
                                            order: [
                                                [ CollectSystemParameter, 'index', 'ASC' ]
                                            ]
                                        }).then(collect_system_data_final_result => {

                                            resolve({ code: 200, response: collect_system_data_final_result });

                                        });

                                    });

                                });


                            }else{
                                resolve({code: 500, message: "unexpected_error"});
                            }

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
        updateCollectSystem,
        updateCollectSystemOrder,
        getCollectReport,
        duplicateCollectSystem
	};
};
