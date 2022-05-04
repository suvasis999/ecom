const multer = require("multer");
const fs = require('fs');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		let filePath = ''
		switch (file.fieldname) {
			case 'doc_1':
			case 'doc_2':
			case 'doc_3':
				filePath = 'upload/vendor_doc'
				break;
			case 'product':
				filePath = 'upload/product'
				break;
			case 'accommodation':
				filePath = 'upload/accommodation'
				break;
			case 'prodCategory':
				filePath = 'upload/prodCategory'
				break;
			default: filePath = 'upload/other'
		}
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath);
		}
		cb(null, filePath)
	},
	filename: function (req, file, cb) {
		cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
	}
});



const upload = multer({ storage: storage });
module.exports = upload 
