module.exports = function(app) {
	const Multer = require('multer');
	const mkdirp = require('mkdirp');
	const md5 = require('md5');

	const storage =   Multer.diskStorage({
		destination: function (req, file, callback) {
			callback(null, __dirname + '/../uploads/');
		},
		filename: function (req, file, callback) {
			try {
				const originalName = file.originalname.split('.')[0];
				const ext = file.originalname.split('.')[1];
				const now = new Date();
				const newFileName =  md5(originalName + now) + '.' + ext;
				callback(null, newFileName);
			} catch(err) {
				callback(err);
			}
		}
	});

	const upload = Multer({
		storage : storage,
		limits: {
			fileSize: 100000000,
			files:1
  	}});

	function createFolders() {
		mkdirp('./uploads', function(err) {
			if (err) {
				console.log(err);
			}
		});
	}

	return {
    	upload: upload,
    	createFolders: createFolders
	};
};
