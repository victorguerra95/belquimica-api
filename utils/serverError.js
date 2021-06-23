module.exports = {

	unknownError: 						errorResponse(10000, "Unknown error"),

	invalidEstablishmentId: 			errorResponse(1000, "Invalid establishment id format"),
	notFoundEstablishment: 				errorResponse(1001, "Establishment not found"),
	invalidEstablishmentName:			errorResponse(1002, "Invalid establishment name"),
	invalidEstablishmentAddress:		errorResponse(1003, "Invalid establishment address"),
	invalidEstablishmentCoordenate:		errorResponse(1004, "Invalid establishment coordenates"),

	invalidProductId: 					errorResponse(2005, "Invalid product type"),
	notFoundProduct: 					errorResponse(2001, "Product not found"),
	invalidProductName:					errorResponse(2002, "Invalid product name"),
	invalidProductPrice:				errorResponse(2003, "Invalid product price"),
	productAlreadyBeingRegistered: 		errorResponse(2004, "Product has already been registered in this establishment"),
	invalidProductImageUrl:  			errorResponse(2006, "Invalid product image url"),

	invalidFileUploadToManyFiles: 		errorResponse(3000, "Invalid file upload. To many files"),

};

function errorResponse(code, message) {
	return {
		responseCode : code,
		responseMessage: message
	};
}
