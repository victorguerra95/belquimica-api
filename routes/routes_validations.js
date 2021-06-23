module.exports = function(app) {
	'use strict'
	const serverError = require('../utils/serverError'),
		util = require('util')

	function validate(req, res, next) {
		let errors;
		errors = req.validationErrors()
		if (errors) {
		    return res.status(400).json(util.inspect(errors[0]['msg']))
		}
		next()
	}

	/*****ESTABLISHMENT VALIDATE*****/
	function createEstablishment(req, res, next) {
		req.checkBody('name', serverError.invalidEstablishmentName).notEmpty()

		validate(req, res, next)
	}

	function readEstablishment(req, res, next) {
		req.checkParams('estIdFromGoogle', serverError.invalidEstablishmentId).notEmpty().isHexadecimal()

		validate(req, res, next)
	}

	function updateEstablishment(req, res, next) {
		req.checkParams('estIdFromGoogle', serverError.invalidEstablishmentId).notEmpty().isHexadecimal()
		req.checkBody('name', serverError.invalidEstablishmentName).notEmpty()

		validate(req, res, next)
	}

	/*****PRODUCT VALIDATE*****/
	function createProduct(req, res, next) {
		req.checkBody('proType', serverError.invalidProductId).notEmpty()
		req.checkBody('proName', serverError.invalidProductName).notEmpty()
		req.checkBody('proPrice', serverError.invalidProductPrice).notEmpty().isDecimal()
		req.checkBody('estIdFromGoogle', serverError.invalidEstablishmentId).notEmpty()
		req.checkBody('estName', serverError.invalidEstablishmentName).notEmpty()
		req.checkBody('estAddress', serverError.invalidEstablishmentAddress).notEmpty()

		validate(req, res, next)
	}

	function readProduct(req, res, next) {
		req.checkParams('_id', serverError.invalidProductId).notEmpty().isHexadecimal()

		validate(req, res, next)
	}

	function readProductList(req, res, next) {

		validate(req, res, next);
	}

	function readProductFromEstablishment(req, res, next) {
		req.checkParams('_id', serverError.invalidProductId).notEmpty().isHexadecimal()
		req.checkParams('estIdFromGoogle', serverError.invalidEstablishmentId).notEmpty().isHexadecimal()

		validate(req, res, next)
	}

	function updateProduct(req, res, next) {
		req.checkParams('_id', serverError.invalidProductId).notEmpty().isHexadecimal()
		req.checkBody('estIdFromGoogle', serverError.invalidEstablishmentId).notEmpty()
		req.checkBody('proPrice', serverError.invalidProductPrice).notEmpty().isDecimal()

		validate(req, res, next)
	}

	return {
		createEstablishment: createEstablishment,
		readEstablishment: readEstablishment,
		updateEstablishment: updateEstablishment,
		createProduct: createProduct,
		readProduct: readProduct,
		readProductFromEstablishment: readProductFromEstablishment,
		readProductList: readProductList,
		updateProduct: updateProduct
	}
}
