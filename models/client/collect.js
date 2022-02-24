
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
	const config = require('../../config');
	const utils = require('../../utils/utils')();
	const async = require('async');
	const moment = require('moment');
    const _ = require('lodash');

    const http = require('https');

    const admin = require('firebase-admin');

    function getCollects(client_user, filter) {

        return new Promise((resolve, reject) => {

            try {

                var whereStament = {
                    client_id: client_user.client_id,
                    report_shared: true
                }

                if(filter.dt_from != null || filter.dt_from != null){
                    whereStament.$or = [
                        {
                            collect_date: {}
                        },
                        {
                            collect_date: null
                        }
                    ];

                    if(filter.dt_from != null){
                        whereStament.$or[0].collect_date.gte = moment(new Date(filter.dt_from)).subtract(1, 'd').format("YYYY-MM-DD") + " 21:00:00.000+00";
                    }

                    if(filter.dt_until != null){
                        whereStament.$or[0].collect_date.lte = moment(new Date(filter.dt_until)).add(1, 'd').format("YYYY-MM-DD") + " 02:59:59.999+00";
                    }
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
                
            } catch (error) {
                resolve({code: 500, message: "unexpected_error"});
            }

        });
    }

    function getCollectReport(client_user, filter) {

        return new Promise((resolve, reject) => {

            try {

                if(filter.collect_id){

                    Collect.findOne({
                        where: {
                            id: filter.collect_id,
                            client_id: client_user.client_id,
                            report_shared: true
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

	return {
        getCollects,
        getCollectReport
	};
};
