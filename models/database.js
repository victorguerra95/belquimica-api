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

		//Files
		const File = sequelize.define('files', {
			name: Sequelize.TEXT,
			type: Sequelize.TEXT,
			url_file: Sequelize.TEXT,
		}, tableDefaultMetadata);

		File.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(File);

		// Syncronize
		sequelize.sync().then(function() {
			seed(User, UserType, Client, ClientUser, Contact, System, Collect, ClientSystem, CollectSystem, Parameter, CollectSystemParameter);

			//scriptInsertCollectSystemsIndex();
			//scriptInsertCollectSystemParametersIndex();

		});

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
			File
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
