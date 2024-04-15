const jwt = require("jsonwebtoken")
const { SECRET_ACCESS_TOKEN } = require("../configs/environments")
const specializationsEnums = require('../utils/enums/specializations')
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeveloperSchema = new Schema({
    projectId: {
        type: [Schema.Types.ObjectId],
        ref: 'Project',
        required: false,
    },
    first_name: {
        type: String,
        required: [true, "Your firstname is required"],
        max: 25,
    },
    last_name: {
        type: String,
        required: [true, "Your lastname is required"],
        max: 25,
    },
    email: {
        type: String,
        required: [true, "Your email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Your password is required"],
        select: false,
        max: 25,
    },
    specialization: {
        type: String,
        enum: specializationsEnums,
        required: [true, "Your specialization is required"],
    },
    role: {
        type: String,
        required: true,
        default: "developer",
    },
    estimationStats: [{
        estimation: { type: Number, default: 0},
        totalHours: { type: Number, default: 0},
        taskCount: { type: Number, default: 0},
        averageTime: { type: Number, default: 0}
    }]
});

// Password hashing
DeveloperSchema.pre("save", function (next) {
    const developer = this;

    if (!developer.isModified("password")) return next();
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(developer.password, salt, (err, hash) => {
            if (err) return next(err);

            developer.password = hash;
            next();
        });
    });
});

// Generating an access token
DeveloperSchema.methods.generateAccessJWT = function () {
    let payload = {
      id: this._id,
    };
    return jwt.sign(payload, SECRET_ACCESS_TOKEN, {
      expiresIn: '20m',
    });
  };

const DeveloperModel = mongoose.model('Developer', DeveloperSchema);

module.exports = DeveloperModel;