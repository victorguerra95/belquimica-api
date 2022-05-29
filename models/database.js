const client = require('./client');

module.exports = function Database(app) {
	'use strict';

	const Sequelize = require('sequelize');
	const async = require('async');
	const Promise = require('promise');
	const config = require('../config');
	const moment = require('moment');
	var request = require('request');

	const schedule = require('node-schedule');

	function setUp(db) {
		let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
		app.set('sequelize', sequelize);

		sequelize.authenticate().then(function (data) {
			//return addPostgistExtension(sequelize);
		}).then(() => {
			defineTables(sequelize);
		}).catch((err) => {
			if(err.message !== 'extension "postgis" already exists') {
				console.log(err);
			}
		});
	}

	function defineTables(sequelize) {
		let tableDefaultMetadata = {
			timestamps: true,
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
			paranoid: true,
			underscored: true,
			freezeTableName: true
		};

		const User = sequelize.define('users', {
			email: Sequelize.STRING,
			firebase_uid: Sequelize.TEXT
		}, tableDefaultMetadata);

		const UserType = sequelize.define('user_types', {
			label: Sequelize.STRING
		}, tableDefaultMetadata);

		const Client = sequelize.define('clients', {
			name: Sequelize.STRING,
			name_term: Sequelize.STRING,
			doc: Sequelize.STRING,
			state: Sequelize.STRING,
			city: Sequelize.STRING,
			address: Sequelize.TEXT
		}, tableDefaultMetadata);

		const System = sequelize.define('systems', {
			name: Sequelize.STRING,
			name_term: Sequelize.STRING
		}, tableDefaultMetadata);

		const ClientSystem = sequelize.define('client_systems', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			client_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Client,
					key: 'id'
				}
			},
			system_id: {
				type: Sequelize.INTEGER,
				references: {
					model: System,
					key: 'id'
				}
			}
		});

		const ClientUser = sequelize.define('client_users', {
		}, tableDefaultMetadata);

		const Contact = sequelize.define('contacts', {
			name: Sequelize.STRING,
			email: Sequelize.STRING,
			sector: Sequelize.STRING
		}, tableDefaultMetadata);

		const Collect = sequelize.define('collects', {
			collect_date: Sequelize.DATE,
			analysis_date: Sequelize.DATE,
			collect_data: Sequelize.JSON,
			report_shared: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
			chart_show: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			}
		}, tableDefaultMetadata);

		const CollectSystem = sequelize.define('collect_systems', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			collect_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Collect,
					key: 'id'
				}
			},
			system_id: {
				type: Sequelize.INTEGER,
				references: {
					model: System,
					key: 'id'
				}
			},
			input_comments: Sequelize.JSON,
			index: Sequelize.INTEGER
		});

		const Parameter = sequelize.define('parameters', {
			name: Sequelize.STRING,
			name_term: Sequelize.STRING
		}, tableDefaultMetadata);

		const CollectSystemParameter = sequelize.define('collect_system_parameters', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			collect_system_id: {
				type: Sequelize.INTEGER,
				references: {
					model: CollectSystem,
					key: 'id'
				}
			},
			parameter_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Parameter,
					key: 'id'
				}
			},
			unit: Sequelize.STRING,
			value: Sequelize.STRING,
			value_graphic: Sequelize.TEXT,
			default_value_min: Sequelize.STRING,
			default_value_max: Sequelize.STRING,
			factor_value_graphic: Sequelize.STRING,
			index: Sequelize.INTEGER,
			chart_show: {
				type: Sequelize.BOOLEAN,
				defaultValue: true
			},
			chart_var_a: Sequelize.STRING,
			chart_var_b: Sequelize.STRING,
			chart_var_c: Sequelize.STRING,
			chart_var_d: Sequelize.STRING
		});

		// Collect, System

		Collect.belongsToMany(System, {
			through: CollectSystem,
			as: 'systems',
			foreignKey: 'collect_id',
			otherKey: 'system_id'
		});

		System.belongsToMany(Collect, {
			through: CollectSystem,
			as: 'collects',
			foreignKey: 'system_id',
			otherKey: 'collect_id'
		});

		Collect.hasMany(CollectSystem, {foreignKey: 'collect_id'});
		CollectSystem.belongsTo(Collect, {foreignKey: 'collect_id', onDelete: 'CASCADE'});

		System.hasMany(CollectSystem, {foreignKey: 'system_id' });
		CollectSystem.belongsTo(System, {foreignKey: 'system_id'});

		// CollectSystem, Parameter

		CollectSystem.belongsToMany(Parameter, {
			through: CollectSystemParameter,
			as: 'parameters',
			foreignKey: 'collect_system_id',
			otherKey: 'parameter_id'
		});

		Parameter.belongsToMany(CollectSystem, {
			through: CollectSystemParameter,
			as: 'collect_systems',
			foreignKey: 'parameter_id',
			otherKey: 'collect_system_id'
		});

		CollectSystem.hasMany(CollectSystemParameter, {foreignKey: 'collect_system_id'});
		CollectSystemParameter.belongsTo(CollectSystem, {foreignKey: 'collect_system_id', onDelete: 'CASCADE'});

		Parameter.hasMany(CollectSystemParameter, {foreignKey: 'parameter_id' });
		CollectSystemParameter.belongsTo(Parameter, {foreignKey: 'parameter_id'});

		// User, UserType

		User.belongsTo(UserType);
		UserType.hasMany(User);

		// ClientUser, User

		ClientUser.belongsTo(User);
		ClientUser.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(ClientUser);

		// Contact, Client

		Contact.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Contact);

		// Collect, Client

		Collect.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Collect);

		// Client, System

		Client.belongsToMany(System, {
			through: ClientSystem,
			as: 'systems',
			foreignKey: 'client_id',
			otherKey: 'system_id'
		});

		System.belongsToMany(Client, {
			through: ClientSystem,
			as: 'clients',
			foreignKey: 'system_id',
			otherKey: 'client_id'
		});

		Client.hasMany(ClientSystem, {foreignKey: 'client_id'});
		ClientSystem.belongsTo(Client, {foreignKey: 'client_id', onDelete: 'CASCADE'});

		System.hasMany(ClientSystem, {foreignKey: 'system_id' });
		ClientSystem.belongsTo(System, {foreignKey: 'system_id'});

		//File
		const File = sequelize.define('files', {
			name: Sequelize.TEXT,
			uid: Sequelize.TEXT,
			type: Sequelize.STRING,
			size: Sequelize.BIGINT,
			url_file: Sequelize.TEXT,
			processed: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
		}, tableDefaultMetadata);

		const ClientFile = sequelize.define('client_files', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			client_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Client,
					key: 'id'
				}
			},
			file_id: {
				type: Sequelize.INTEGER,
				references: {
					model: File,
					key: 'id'
				}
			},
		});
		Client.belongsToMany(File, { through: ClientFile });
		File.belongsToMany(Client, { through: ClientFile });
		ClientFile.belongsTo(Client, {
			foreignKey: {
			  name: 'client_id'
			},
			onDelete: 'CASCADE'
		});
		Client.hasMany(ClientFile);
		ClientFile.belongsTo(File, {
			foreignKey: {
			  name: 'file_id'
			},
			onDelete: 'CASCADE'
		});
		File.hasMany(ClientFile);

		//Email
		const Email = sequelize.define('emails', {
			date: Sequelize.DATE,
			sent: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
			sent_date: Sequelize.DATE,
			error: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
			error_text: Sequelize.TEXT
		}, tableDefaultMetadata);

		Email.belongsTo(Collect, {onDelete: 'CASCADE'});
		Collect.hasMany(Email);

		// Syncronize
		sequelize.sync().then(function() {
			seed(User, UserType, Client, ClientUser, Contact, System, Collect, ClientSystem, CollectSystem, Parameter, CollectSystemParameter);
			startCrawlers();

			//scriptInsertCollectSystemsIndex();
			//scriptInsertCollectSystemParametersIndex(); 

			/*
			let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
			app.set('sequelize', sequelize);
            sequelize.authenticate();

			//MAX(collects.collect_date) as collect_date
            var query_s = 
            "SELECT clients.*, MAX(collects.created_at) as collect_date " +
            "FROM clients " + 
            "INNER JOIN collects on clients.id = collects.client_id " + 
			"GROUP BY clients.id, collects.client_id " + 
            //"INNER JOIN districts dis on ads.district_id = dis.id " + 
            //"WHERE " + where_stament + " " +
            "ORDER BY collect_date DESC NULLS LAST";
			
			sequelize.query(query_s).spread((result, metadata) => {
				//console.log(JSON.stringify(result));
				console.log(result.length);
				console.log(JSON.stringify(result[0]));
				console.log(JSON.stringify(result[1]));
				console.log(JSON.stringify(result[2]));
				console.log(JSON.stringify(result[3]));
				console.log(JSON.stringify(result[4]));
				console.log(JSON.stringify(result[5]));
				//resolve(result);
			});*/

		});

		function startCrawlers(){
			let ip = require("ip");
			if(ip.address() === "143.198.237.70"){
				console.log("prod");

				let jobList = schedule.scheduledJobs;
				console.log("schedule.scheduledJobs: " + JSON.stringify(jobList));
				for(jobName in jobList){
					let job = 'jobList.' + jobName;
					eval(job+'.cancel()');
				}

				let key = Object.keys(schedule.scheduledJobs)[0];
				if(!key){
					let jobStartCrawlers = schedule.scheduleJob('jobSendEmailsNotification', '*/30 * * * *', sendEmailsNotification);
					console.log("jobSendEmailsNotification: " + jobStartCrawlers.nextInvocation());
				};	
			}else{
				console.log("local");
			}
		}

		let sendEmailsNotification = function(){
			let flow = async () => {

				console.log("start sendEmailsNotification");

				let emails = await Email.findAll({
					where: {
						sent: false,
						error: false,
						date: {
							lte: moment().toDate()
						}
					},
					include: [
						{
							model: Collect,
							include: [
								{
									model: Client,
									include: [
										{
											model: Contact
										}
									]
								}
							]
						}
					]
				});

				console.log("emails to send: " + emails.length);

				for (let index = 0; index < emails.length; index++) {
					let email = emails[index];
					console.log("\n\nindex: " + index + " de "+ emails.length);
					console.log(JSON.stringify(email));

					try {
						
						let send_email_result = await sendEmail(email);
						console.log("send_email_result: " + JSON.stringify(send_email_result));

						if(send_email_result.is_ok == false){

							await Email.update({error: true, error_text: send_email_result.message, sent_date: moment().toDate()}, {
								where: {
									id: email.id
								}
							});

						}else{

							await Email.update({sent: true, error: false, sent_date: moment().toDate()}, {
								where: {
									id: email.id
								}
							});

						}

					} catch (error) {
						console.log("error sendEmailsNotification catch: " + error);
						await Email.update({error: true, error_text: error, sent_date: moment().toDate()}, {
							where: {
								id: email.id
							}
						});
					}
					
				}

			}
			flow().then((value) => {
				console.log("DONE sendEmailsNotification");
			});	
		}

		function sendEmail(email) {
			return new Promise(function (resolve, reject) {

				try {

					//https://www.willpeavy.com/tools/minifier/
					const nodemailer = require('nodemailer');

					//MOCK
					email.collect.client.contacts = [{email: "victor+bel@vupcorp.com"}, {email: "victor@belquimica.ind.br"}];
					//email.collect.client.contacts = [{email: "victor+bel@vupcorp.com"}];

					if(email.collect.client.contacts == null || email.collect.client.contacts.length == 0){

						console.log("sem contatos");
						resolve({is_ok: true });

					}else{

						let emails_to = email.collect.client.contacts.map(function(c) {
							return c.email;
						});

						async function main() {
							// Generate test SMTP service account from ethereal.email
							// Only needed if you don't have a real mail account for testing
							let testAccount = await nodemailer.createTestAccount();
	
							// create reusable transporter object using the default SMTP transport
							let transporter = nodemailer.createTransport({
								host: "smtp.zoho.com",
								port: 465,
								secure: true, // true for 465, false for other ports
								auth: {
									user: "belquimicadev@zohomail.com", // generated ethereal user
									pass: "belquimicadev@12", // generated ethereal password
								},
							});
	
							// send mail with defined transport object
							let info = await transporter.sendMail({
								from: '"Cliente Belquimica" <belquimicadev@zohomail.com>', // sender address
								to: emails_to.toString(), // list of receivers
								subject: "Acompanhamento Online Belquimica - " + email.collect.client.name, // Subject line
								html: '<!doctype html><html> <head> <meta http-equiv="Content-Type" content="text/html charset=UTF-8"/> </head> <body> <center> <div style="width: fit-content;background-color: white;height: 100%;padding-left: 50px;padding-right: 50px;"> <table style="border-collapse: collapse;max-width: 520px;background-color: white;"> <tbody> <tr> <td style="border: 1px solid black;text-align: center;"> <img src="https://admbelquimica.vupapp.com/images/logo.png" width="110px" height="80px"> </td><td style="border: 1px solid black"> <p style="font-weight: 700;text-align: center;">Acompanhamento Online</p><p style="font-weight: 700;text-align: center;">– Relatório De Análises –</p></td></tr><tr> <td colspan="2" style="border: 1px solid black" > <p style="font-weight: 700;color: #016600;text-align: center;margin-left: 20px;margin-right: 20px;">BELQUIMICA PRODUTOS E ASSISTÊNCIA TÉCNICA LTDA.</p></td></tr><tr> <td colspan="2" style="border: 1px solid black;background-color: #339a65;"> <p style="font-weight: 700;color: white;text-align: center;">www.belquimica.ind.br</p></td></tr><tr> <td colspan="2"> <div style="height: 10px"></div></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 5px;"> Prezado Cliente, </p></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 5px;"> Informamos que foi disponibilizado no portal “Área do Cliente” um novo Relatório de Análise; segue também em anexo. </p></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 5px;"> O portal “Área do Cliente” permite o acesso ágil aos últimos Relatórios de Análise enviados e comporta ainda um diretório onde poderemos anexar documentos relevantes, ficando também, disponíveis para consultas futuras. </p></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 12px;"> O portal “Área do Cliente” está disponível pelo link e QR Code abaixo: </p></td></tr><tr> <td colspan="2"> <a href="https://clientebelquimica.vupapp.com/">https://clientebelquimica.vupapp.com/</a> </td></tr><tr> <td colspan="2"> <div style="height: 20px"></div></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 12px;"> Caso ainda não disponha de login e senha para acesso, gentileza solicitar ao e-mail abaixo: </p></td></tr><tr> <td colspan="2"> <a href="mailto:laboratorio@belquimica.ind.br">laboratorio@belquimica.ind.br/</a> </td></tr><tr> <td colspan="2"> <div style="height: 20px"></div></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 12px;"> Não responda este e-mail. Caso deseje entrar em contato, gentileza responder ao e-mail abaixo: </p></td></tr><tr> <td colspan="2"> <a href="mailto:laboratorio@belquimica.ind.br">laboratorio@belquimica.ind.br/</a> </td></tr><tr> <td colspan="2"> <div style="height: 20px"></div></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 5px;"> Desde já agradecemos e permanecemos à disposição. </p></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 5px;"> Atenciosamente, </p></td></tr><tr> <td colspan="2"> <div style="height: 5px"></div></td></tr><tr> <td colspan="2"> <p style="color: #385623;margin-bottom: 0px;"> Equipe Belquimica </p><p style="color: #385623;margin-bottom: 0px;margin-top: 5px;font-size: 13px;"> Belquimica Produtos e Assistência Técnica Ltda. </p><p style="color: #385623;margin-bottom: 0px;margin-top: 5px;font-size: 13px;"> www.belquimica.ind.br </p></td></tr><tr> <td colspan="2"> <div style="height: 15px"></div></td></tr></tbody> </table> </div></center> <style>body{font-family: Arial, Helvetica, sans-serif; background-color: #FAFAFA;}</style> </body></html>'
							});
	
							console.log("Message sent: %s", info.messageId);
							console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
	
							resolve({is_ok: true });
						}
	
						//main().catch(console.error);
						main().catch(function (err){
							console.log("error sendEmail catch: " + err);
							resolve({is_ok: false, message: err});
						});

					}

				} catch (error) {
					console.log("error try: " + error);
					resolve({is_ok: false, message: error});
				}
				
			});
		}

		function seed(User, UserType, Client, ClientUser, Contact, System, Collect, ClientSystem, CollectSystem, Parameter, CollectSystemParameter){
			UserType.count().then(c => {
				if(c == 0){
					var types = require('../config/seed_user_type.json');
					UserType.bulkCreate(types, {
						fields: ['label']
					}).then(data => {
						console.log("seed_user_type created: " + data.length);

						User.count({
							where: {
								email: "belquimicadev@gmail.com"
							}
						}).then(c => {
							if(c == 0){
				
								var new_user = {
									email: "belquimicadev@gmail.com",
									firebase_uid: "KrABDB3dzuRt9OgxxYAz7bC1X3f2"
								};
				
								User.create({
									email: new_user.email,
									firebase_uid: new_user.firebase_uid,
									user_type_id: 1
								}).then(data => {
									console.log("User dev created: " + data);

									new_user = {
										email: "victor@belquimica.ind.br",
										firebase_uid: "JU2uOnWNX9YYDqoab2KaOjdvKwF2"
									};
					
									User.create({
										email: new_user.email,
										firebase_uid: new_user.firebase_uid,
										user_type_id: 1
									}).then(data => {
										console.log("User dev created: " + data);
									});

								});
							}
						});

					});
				}
			});
			//mockCollects(Client);
		}

		function scriptInsertCollectSystemsIndex(){

			try {

				Collect.findAll({
					attributes: ["id"],
					where: {},
					include: [
						{
							model: CollectSystem,
							attributes: ["id"]
						}
					],
					order: [
						[ CollectSystem, 'id', 'ASC' ]
						//[ CollectSystem, CollectSystemParameter, 'id', 'ASC' ]
					]
				}).then(collects => {

					let flow = async () => {

						try {
							
							for (let index_collect = 0; index_collect < collects.length; index_collect++) {

								let collect = collects[index_collect];

								for (let index_system = 0; index_system < collect.collect_systems.length; index_system++) {

									let collect_system = collect.collect_systems[index_system];

									var result_update_collect_system = await updateCollectSystem(collect_system.id, { "index": index_system } );
									console.log("result_update_collect_system: " + JSON.stringify(result_update_collect_system));
									if(result_update_collect_system.is_ok == false){
										throw "error index collect_system i " + index_system + " id " + collect_system.id + " collect id " + collect.id;
									}

								}

							}

						} catch (error) {
							
							console.log("ERROR FLOW scriptInsertCollectSystemsIndex: " + error);

						}

						return true
					}
					
					flow().then((value) => {
						console.log("scriptInsertCollectSystemsIndex: " + value);
					});

				});

			} catch (error) {
				
				console.log("ERROR scriptInsertCollectSystemsIndex: " + error);

			}

		}

		function updateCollectSystem(collect_system_id, changes){
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

		function scriptInsertCollectSystemParametersIndex(){

			try {

				Collect.findAll({
					attributes: ["id"],
					where: {},
					include: [
						{
							model: CollectSystem,
							attributes: ["id"],
							include: [
								{
									model: CollectSystemParameter,
									attributes: ["id"]
								}
							]
						}
					],
					order: [
						[ CollectSystem, 'index', 'ASC' ],
						[ CollectSystem, CollectSystemParameter, 'id', 'ASC' ]
					]
				}).then(collects => {

					let flow = async () => {

						try {
							
							for (let index_collect = 0; index_collect < collects.length; index_collect++) {

								let collect = collects[index_collect];

								for (let index_system = 0; index_system < collect.collect_systems.length; index_system++) {

									let collect_system = collect.collect_systems[index_system];

									for (let index_parameter = 0; index_parameter < collect_system.collect_system_parameters.length; index_parameter++) {
										
										let collect_system_parameter = collect_system.collect_system_parameters[index_parameter];

										var result_update_collect_system_parameter = await updateCollectSystemParameter(collect_system_parameter.id, { "index": index_parameter } );
										console.log("result_update_collect_system_parameter: " + JSON.stringify(result_update_collect_system_parameter));
										if(result_update_collect_system_parameter.is_ok == false){
											throw "error index collect_system_parameter i " + index_parameter + " id " + collect_system_parameter.id + " collect_system id " + collect_system.id;
										}

									}

								}

							}

						} catch (error) {
							
							console.log("ERROR FLOW scriptInsertCollectSystemsIndex: " + error);

						}

						return true
					}
					
					flow().then((value) => {
						console.log("scriptInsertCollectSystemsIndex: " + value);
					});

				});

			} catch (error) {
				
				console.log("ERROR scriptInsertCollectSystemsIndex: " + error);

			}

		}

		function updateCollectSystemParameter(collect_system_parameter_id, changes){
			return new Promise(function (resolve, reject) {
	
				try {

					CollectSystemParameter.update(changes, {
						where: {
							id: collect_system_parameter_id
						}
					}).then(collect_system_parameter_update => {
						resolve({is_ok: true });
					});
	
					
				} catch (error) {
					resolve({is_ok: false, error: error});
				}
			});
		}

		function mockCollects(){
			Client.findAll({
				limit: 1,
				order: [
					[ 'id', 'DESC' ]
				]
			}).then(clients => {
				
				if(clients.length > 0){
					
					let client_destiny = clients[0];

					let mock_data = require('../example_data_collect.json');
					//console.log(JSON.stringify(mock_data));

					Collect.create({
					}).then(new_collect_created => {	

						let flow = async () => {
											
							try {
								var error = false;
								//for (let index = 0; index < mock_data.systems.length; index++) {
								for (let index = 0; index < 2; index++) {
									var mock_system = mock_data.systems[index];
									var result = await duplicateCollectSystem(new_collect_created.id, mock_system);
									if(result.status == false){
										error = true;
										break;
									}else{
										let new_parameters = [];
										var error_dup_parameter = false;
										for (let index_dup_parameter = 0; index_dup_parameter < mock_system.inputs.length; index_dup_parameter++) {
											let mock_parameter = mock_system.inputs[index_dup_parameter];
											var result_dup_parameter = await duplicateCollectSystemParameters(new_collect_created.id, mock_system, result.new_collect_system_created, mock_parameter);
											if(result_dup_parameter.status == false){
												error_dup_parameter = true;
												break;
											}else{
												new_parameters.push(result_dup_parameter.new_parameter);
											}
										}
										if(error_dup_parameter == true){
											error = true;
											break;
										}else{
											console.log(JSON.stringify(new_parameters));
											CollectSystemParameter.bulkCreate(new_parameters, {
												fields: ['collect_system_id', 'parameter_id','unit', 'value', 'value_graphic', 'default_value_min', 'default_value_max']
											}).then(new_parameters_created => {
												console.log("new_parameters_created: " + new_parameters_created);
											}).catch(function(err) {
												// print the error details
												console.log("bulkCreate: " + err);
											});
										}
									}
								}
								
								if(!error){

									Collect.update({ client_id: client_destiny.id }, {
										where: {
											id: new_collect_created.id
										}
									}).then(update_collect => {
										//resolve({code: 200, response: new_collect_created });
									});
									
								}else{
									//resolve({code: 500, message: "unexpected_error"});
								}

								return error;

							} catch (error) {

								//resolve({code: 500, message: "unexpected_error"});
								return false;
							}               
						}
						
						flow().then((value) => {
							//console.log("duplicate_collect_function_result_error: " + value);
						});	

					});	


				}

			});
		}

		function duplicateCollectSystem(new_collect_id, mock_system){
			return new Promise(function (resolve, reject) {
	
				try {

					System.findOrCreate({
						where: {
							name_term: formatTerm(mock_system.name)
						},
						defaults: {
							name: mock_system.name,
							name_term: formatTerm(mock_system.name)
						}
					}).then(system_find_data => {	

						let system_found = system_find_data[0];

						CollectSystem.create({
							collect_id: new_collect_id,
							system_id: system_found.id,
							input_comments: {
								input_technical_advice: mock_system.input_technical_advice,
								input_recommendations: mock_system.input_recommendations,
								input_dosages: mock_system.input_dosages
							}
						}).then(new_collect_system_created => {	

							resolve({status: true, new_collect_system_created: new_collect_system_created });

						});

					});
	
					
				} catch (error) {
					resolve({status: false, error: error});
				}
			});
		}

		function duplicateCollectSystemParameters(new_collect_id, mock_system, new_collect_system_created, mock_parameter){
			return new Promise(function (resolve, reject) {
	
				try {

					Parameter.findOrCreate({
						where: {
							name_term: formatTerm(mock_parameter.parameter)
						},
						defaults: {
							name: mock_parameter.parameter,
							name_term: formatTerm(mock_parameter.parameter)
						}
					}).then(paramter_find_data => {	

						let parameter_found = paramter_find_data[0];

						let new_parameter = {
							collect_system_id: new_collect_system_created.id,
							parameter_id: parameter_found.id,
							unit: mock_parameter.unit,	
							default_value_min: mock_parameter.default_value_min,
							default_value_max: mock_parameter.default_value_max
						};

						//format values
						let value = parseFloat(mock_parameter.value);
						
						if(value == 0){
							let random_int_variant = Math.floor(Math.random() * (10 - 2) ) + 2;
							value = random_int_variant;
						}else{
							let random_percent_variant = Math.floor(Math.random() * (35 - 5) ) + 5;
							if(random_percent_variant % 2 == 0){
								//++
								value = value + ((value * random_percent_variant) / 100);
							}else{
								//--
								value = value - ((value * random_percent_variant) / 100);
							}
						}
						
						new_parameter.value = ("" + value.toFixed(2)).replace(new RegExp('[.]','gi'), ',');
						new_parameter.value_graphic = ("" + value.toFixed(2)).replace(new RegExp('[.]','gi'), ',');

						if(new_parameter.default_value_min != null && new_parameter.default_value_min.length > 0){
							new_parameter.default_value_min = new_parameter.default_value_min.replace(new RegExp('[.]','gi'), ',')
						}

						if(new_parameter.default_value_max != null && new_parameter.default_value_max.length > 0){
							new_parameter.default_value_max = new_parameter.default_value_max.replace(new RegExp('[.]','gi'), ',')
						}

						resolve({status: true, new_parameter: new_parameter});

					}).catch(function(err) {
						// print the error details
						console.log("duplicateCollectSystemParameters: " + err);
					});
	
					
				} catch (error) {
					resolve({status: false, error: error});
				}
			});
		}

		app.set('models', {
			User,
			UserType,
			Client,
			ClientUser,
			Contact,
			System,
			Collect,
			ClientSystem,
			CollectSystem,
			Parameter,
			CollectSystemParameter,
			File,
			ClientFile,
			Email
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
		setUp
	};
};
