const mongoose = require('mongoose');
const { validationResult } = require('express-validator')

// Checking for validation errors
const Validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = {};
        errors.array().map((err) => (error[err.path || 'unknown'] = err.msg));
        return res.status(422).json({ error });
    }
    next();
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
    Validate,
    isValidObjectId
  };