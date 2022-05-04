const ErrorResponse = require('./errorResponse');

const errorHandler = (err,req, res,next) => {
	let error = { ...err };
	error.message = err.message;
	//log error for developer
	console.log(err.stack);

	if (err.name === 'CastError') {
		const message = `Resource not found with id ${err.value}`;
		error = new ErrorResponse(message, 404);
	}

	//mongoose duplicate error
	if (err.code === 11000) {
		const message = 'Duplicate field error';
		error = new ErrorResponse(message, 400);
	}

	//Mongoose validation error
	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map((val) => val.message);
		error = new ErrorResponse(message, 400);
	}

	res.status(error.statusCode || 500).json({
		status: false,
		error: error.message || 'server error',
	});
};

module.exports = errorHandler;
