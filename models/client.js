module.exports = function(app) {
	'use strict';

    const User = app.get('models').User;
    const Client = app.get('models').Client;
    const Contact = app.get('models').Contact;
    const System = app.get('models').System;
    const ClientSystem = app.get('models').ClientSystem;
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
                                        model: ClientSystem,
                                        include: [
                                            {
                                                model: System
                                            }
                                        ]
                                    },
                                    {
                                        model: ClientUser,
                                        include: [
                                            {
                                                model: User
                                            }
                                        ]
                                    }
                                ],
                                order: [ 
                                    [ { model: Contact }, 'id', 'ASC' ],
                                    [ { model: ClientSystem }, 'id', 'ASC' ],
                                    [ { model: ClientUser }, 'id', 'ASC' ]
                                ],
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
                                include: [
                                    {
                                        model: ClientSystem,
                                        include: [
                                            {
                                                model: System
                                            }
                                        ]
                                    },
                                    {
                                        model: Collect,
                                        limit: 1,
                                        order: [
                                            ["id", "DESC"]
                                        ]
                                    }
                                ],
                                order: [
                                    ["id", "DESC"]
                                ],
                                offset: off,
                                //limit: 30,
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

                        if(new_client.name != null && new_client.name.length > 0){
                            new_client.name_term = formatTerm(new_client.name);
                        }

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

                                if(data_to_update.name != null && data_to_update.name.length > 0){
                                    data_to_update.name_term = formatTerm(data_to_update.name);
                                }

                                Client.update(data_to_update, {where:  {id: filter.client_id} }).then(itemDataUpdate => {	
                                    resolve({code: 200, response: true});
                                });

                            }else if(filter.data == "contact"){

                                let contact_data = { client_id: filter.client_id };
                                let parameters_parser_arr = null;
                                let entity_db = Contact;

                                parameters_parser_arr = ["name", "email", "sector"];

                                parameters_parser_arr.forEach(param => {
                                    if(data[param] != null){
                                        contact_data[param] = data[param];
                                    }
                                });

                                if(filter.action == "create"){
                                    entity_db.create(contact_data).then(data_created => {
                                        Client.findOne({
                                            where: {
                                                id: filter.client_id
                                            },
                                            include: [
                                                {
                                                    model: Contact
                                                },
                                                {
                                                    model: ClientSystem,
                                                    include: [
                                                        {
                                                            model: System
                                                        }
                                                    ]
                                                },
                                                {
                                                    model: ClientUser,
                                                    include: [
                                                        {
                                                            model: User
                                                        }
                                                    ]
                                                }
                                            ],
                                            order: [ 
                                                [ { model: Contact }, 'id', 'ASC' ],
                                                [ { model: ClientSystem }, 'id', 'ASC' ],
                                                [ { model: ClientUser }, 'id', 'ASC' ]
                                            ],
                                        }).then(client_result => {
                                            resolve({ code: 200, response: client_result });
                                        });
                                    });
                                }else if(filter.action == "update"){
                                    entity_db.update(contact_data, {where:  {id: data.id} }).then(itemDataUpdate => {	
                                        Client.findOne({
                                            where: {
                                                id: filter.client_id
                                            },
                                            include: [
                                                {
                                                    model: Contact
                                                },
                                                {
                                                    model: ClientSystem,
                                                    include: [
                                                        {
                                                            model: System
                                                        }
                                                    ]
                                                },
                                                {
                                                    model: ClientUser,
                                                    include: [
                                                        {
                                                            model: User
                                                        }
                                                    ]
                                                }
                                            ],
                                            order: [ 
                                                [ { model: Contact }, 'id', 'ASC' ],
                                                [ { model: ClientSystem }, 'id', 'ASC' ],
                                                [ { model: ClientUser }, 'id', 'ASC' ]
                                            ],
                                        }).then(client_result => {
                                            resolve({ code: 200, response: client_result });
                                        });
                                    });
                                }else if(filter.action == "delete"){
                                    entity_db.destroy({
                                        force: true,
                                        where: {
                                            id: data.id
                                        }
                                    }).then(destroyData => {
                                        Client.findOne({
                                            where: {
                                                id: filter.client_id
                                            },
                                            include: [
                                                {
                                                    model: Contact
                                                },
                                                {
                                                    model: ClientSystem,
                                                    include: [
                                                        {
                                                            model: System
                                                        }
                                                    ]
                                                },
                                                {
                                                    model: ClientUser,
                                                    include: [
                                                        {
                                                            model: User
                                                        }
                                                    ]
                                                }
                                            ],
                                            order: [ 
                                                [ { model: Contact }, 'id', 'ASC' ],
                                                [ { model: ClientSystem }, 'id', 'ASC' ],
                                                [ { model: ClientUser }, 'id', 'ASC' ]
                                            ],
                                        }).then(client_result => {
                                            resolve({ code: 200, response: client_result });
                                        });
                                    });
                                }

                            }else if(filter.data == "system"){

                                if(filter.action == "create" || filter.action == "update"){

                                    let name_term = formatTerm(data.system.name);

                                    System.findOrCreate({
                                        where: {
                                            name_term: name_term
                                        },
                                        defaults: {
                                            name: data.system.name,
                                            name_term: name_term
                                        }
                                    }).then(systemFindData => {	
                                        
                                        let system_data = JSON.parse(JSON.stringify(systemFindData[0]));

                                        if(filter.action == "create"){

                                            ClientSystem.create({
                                                client_id: parseInt(filter.client_id),
                                                system_id: system_data.id
                                            }).then(client_system_data => {

                                                Client.findOne({
                                                    where: {
                                                        id: filter.client_id
                                                    },
                                                    include: [
                                                        {
                                                            model: Contact
                                                        },
                                                        {
                                                            model: ClientSystem,
                                                            include: [
                                                                {
                                                                    model: System
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            model: ClientUser,
                                                            include: [
                                                                {
                                                                    model: User
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    order: [ 
                                                        [ { model: Contact }, 'id', 'ASC' ],
                                                        [ { model: ClientSystem }, 'id', 'ASC' ],
                                                        [ { model: ClientUser }, 'id', 'ASC' ]
                                                    ],
                                                }).then(client_result => {
                                                    resolve({ code: 200, response: client_result });
                                                });

                                            });

                                        }else if(filter.action == "update"){

                                            ClientSystem.update({ system_id: system_data.id }, {where:  {id: data.id} }).then(itemDataUpdate => {	
                                                Client.findOne({
                                                    where: {
                                                        id: filter.client_id
                                                    },
                                                    include: [
                                                        {
                                                            model: Contact
                                                        },
                                                        {
                                                            model: ClientSystem,
                                                            include: [
                                                                {
                                                                    model: System
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            model: ClientUser,
                                                            include: [
                                                                {
                                                                    model: User
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    order: [ 
                                                        [ { model: Contact }, 'id', 'ASC' ],
                                                        [ { model: ClientSystem }, 'id', 'ASC' ],
                                                        [ { model: ClientUser }, 'id', 'ASC' ]
                                                    ],
                                                }).then(client_result => {
                                                    resolve({ code: 200, response: client_result });
                                                });
                                            });

                                        }

                                    });
                                }else if(filter.action == "delete"){
                                    ClientSystem.destroy({
                                        force: true,
                                        where: {
                                            id: data.id
                                        }
                                    }).then(destroyData => {
                                        Client.findOne({
                                            where: {
                                                id: filter.client_id
                                            },
                                            include: [
                                                {
                                                    model: Contact
                                                },
                                                {
                                                    model: ClientSystem,
                                                    include: [
                                                        {
                                                            model: System
                                                        }
                                                    ]
                                                },
                                                {
                                                    model: ClientUser,
                                                    include: [
                                                        {
                                                            model: User
                                                        }
                                                    ]
                                                }
                                            ],
                                            order: [ 
                                                [ { model: Contact }, 'id', 'ASC' ],
                                                [ { model: ClientSystem }, 'id', 'ASC' ],
                                                [ { model: ClientUser }, 'id', 'ASC' ]
                                            ],
                                        }).then(client_result => {
                                            resolve({ code: 200, response: client_result });
                                        });
                                    });
                                }

                            }else if(filter.data == "user"){

                                if(filter.action == "create"){

                                    data.user.email = data.user.email.trim();
                                    data.user.email = data.user.email.toLowerCase();

                                    admin
                                    .auth()
                                    .createUser({
                                        email: data.user.email,
                                        password: data.user.password
                                    })
                                    .then((userRecordFirebase) => {
                                        
                                        User.create({
                                            email: data.user.email,
                                            firebase_uid: userRecordFirebase.uid,
                                            user_type_id: 2
                                        }).then(userCreated => {	
                                            
                                            ClientUser.create({
                                                user_id: userCreated.id,
                                                client_id: filter.client_id
                                            }).then(clientUserCreated => {	
                                                
                                                Client.findOne({
                                                    where: {
                                                        id: filter.client_id
                                                    },
                                                    include: [
                                                        {
                                                            model: Contact
                                                        },
                                                        {
                                                            model: ClientSystem,
                                                            include: [
                                                                {
                                                                    model: System
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            model: ClientUser,
                                                            include: [
                                                                {
                                                                    model: User
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    order: [ 
                                                        [ { model: Contact }, 'id', 'ASC' ],
                                                        [ { model: ClientSystem }, 'id', 'ASC' ],
                                                        [ { model: ClientUser }, 'id', 'ASC' ]
                                                    ],
                                                }).then(client_result => {
                                                    resolve({ code: 200, response: client_result });
                                                });

                                            });

                                        });
                                    })
                                    .catch((error) => {
                                        resolve({code: 500, message: error.code});
                                        //auth/email-already-exists
                                    });

                                }else if(filter.action == "update"){

                                    data.user.email = data.user.email.trim();
                                    data.user.email = data.user.email.toLowerCase();

                                    User.findOne({
                                        where: {
                                            id: data.user.id
                                        }
                                    }).then(getUserDb => {	

                                        var changes_user = {
                                            password: data.user.password
                                        };
                                        
                                        if(data.user.email != getUserDb.email){
                                            changes_user.email = data.user.email;
                                        }

                                        admin
                                        .auth()
                                        .updateUser(data.user.firebase_uid, changes_user)
                                        .then((userRecord) => {

                                            if(changes_user.email != null && changes_user.email.length > 0){
                                                User.update({ email: changes_user.email },{
                                                    where:  {
                                                        id: data.user.id
                                                    } 
                                                }).then(itemDataUpdate => {	
                                                    
                                                    Client.findOne({
                                                        where: {
                                                            id: filter.client_id
                                                        },
                                                        include: [
                                                            {
                                                                model: Contact
                                                            },
                                                            {
                                                                model: ClientSystem,
                                                                include: [
                                                                    {
                                                                        model: System
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                model: ClientUser,
                                                                include: [
                                                                    {
                                                                        model: User
                                                                    }
                                                                ]
                                                            }
                                                        ],
                                                        order: [ 
                                                            [ { model: Contact }, 'id', 'ASC' ],
                                                            [ { model: ClientSystem }, 'id', 'ASC' ],
                                                            [ { model: ClientUser }, 'id', 'ASC' ]
                                                        ],
                                                    }).then(client_result => {
                                                        resolve({ code: 200, response: client_result });
                                                    });
    
                                                });
                                            }else{
                                                Client.findOne({
                                                    where: {
                                                        id: filter.client_id
                                                    },
                                                    include: [
                                                        {
                                                            model: Contact
                                                        },
                                                        {
                                                            model: ClientSystem,
                                                            include: [
                                                                {
                                                                    model: System
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            model: ClientUser,
                                                            include: [
                                                                {
                                                                    model: User
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    order: [ 
                                                        [ { model: Contact }, 'id', 'ASC' ],
                                                        [ { model: ClientSystem }, 'id', 'ASC' ],
                                                        [ { model: ClientUser }, 'id', 'ASC' ]
                                                    ],
                                                }).then(client_result => {
                                                    resolve({ code: 200, response: client_result });
                                                });
                                            }
                                        })
                                        .catch((error) => {
                                            resolve({code: 500, message: error.code});
                                        });

                                    });

                                }else if(filter.action == "delete"){

                                    ClientUser.findOne({
                                        where: {
                                            id: data.id
                                        },
                                        include: [
                                            {
                                                model: User
                                            }
                                        ]
                                    }).then(clientUserDb => {	

                                        admin
                                        .auth()
                                        .deleteUser(clientUserDb.user.firebase_uid)
                                        .then(() => {
                                            
                                            User.destroy({
                                                where: {
                                                    id: clientUserDb.user.id
                                                },
                                                force: true
                                            }).then(removeUserData => {	
                                                
                                                ClientUser.destroy({
                                                    where: {
                                                        id: clientUserDb.id
                                                    },
                                                    force: true
                                                }).then(removeClientUserData => {	
                                                    
                                                    Client.findOne({
                                                        where: {
                                                            id: filter.client_id
                                                        },
                                                        include: [
                                                            {
                                                                model: Contact
                                                            },
                                                            {
                                                                model: ClientSystem,
                                                                include: [
                                                                    {
                                                                        model: System
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                model: ClientUser,
                                                                include: [
                                                                    {
                                                                        model: User
                                                                    }
                                                                ]
                                                            }
                                                        ],
                                                        order: [ 
                                                            [ { model: Contact }, 'id', 'ASC' ],
                                                            [ { model: ClientSystem }, 'id', 'ASC' ],
                                                            [ { model: ClientUser }, 'id', 'ASC' ]
                                                        ],
                                                    }).then(client_result => {
                                                        resolve({ code: 200, response: client_result });
                                                    });
        
                                                });

                                            });
                                        })
                                        .catch((error) => {
                                            resolve({code: 500, message: error.code});
                                        });

                                    });

                                    
                                }
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

    function deleteClient(firebase_uid, filter) {

        return new Promise((resolve, reject) => {

            try {

                User.findOne({
                    where: {
                        firebase_uid: firebase_uid
                    }
                }).then(userData => {	

                    if(userData != null){

                        if(filter.client_id){

                            ClientUser.findAll({
                                where: {
                                    client_id: filter.client_id
                                },
                                include: [
                                    {
                                        model: User
                                    }
                                ]
                            }).then(clientUsers => {	

                                var clientUsersFirebaseUids = clientUsers.map(function(c) {
                                    return c.user.firebase_uid;
                                });
                                
                                admin
                                .auth()
                                .deleteUsers(clientUsersFirebaseUids)
                                .then((deleteUsersResult) => {
                                    
                                    var clientUsersIds = clientUsers.map(function(c) {
                                        return c.user_id
                                    });

                                    User.destroy({
                                        where: {
                                            id: {
                                                in: clientUsersIds
                                            }
                                        },
                                        force: true
                                    }).then(removeUserDataResult => {	
                                        
                                        Client.destroy({
                                            where: {
                                                id: filter.client_id
                                            },
                                            force: true
                                        }).then(removeDataResult => {	
                                            resolve({ code: 200, response: removeDataResult });
                                        });
    
                                    });

                                }).catch((error) => {
                                    resolve({code: 500, message: error.code});
                                });
                            })


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
        getClients,
        createClient,
        updateClient,
        deleteClient
	};
};
