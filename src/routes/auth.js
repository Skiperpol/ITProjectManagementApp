const express = require('express')
const { Register, Login, Logout } = require('../controllers/auth.js')
const { Validate } = require('../middlewares/validate.js')
const { check } = require('express-validator');
const { Verify, VerifyRole } = require('../middlewares/verify')
const specializationsEnum = require('../utils/enums/specializations.js')
const router = express.Router();

const validationRegister = [
    check("email")
        .isEmail()
        .withMessage("Enter a valid email address")
        .normalizeEmail(),
    check("first_name")
        .not()
        .isEmpty()
        .withMessage("You first name is required")
        .trim()
        .escape(),
    check("last_name")
        .not()
        .isEmpty()
        .withMessage("You last name is required")
        .trim()
        .escape(),
    check("password")
        .notEmpty()
        .isLength({ min: 8 })
        .withMessage("Must be at least 8 chars long"),
    check("specialization")
        .notEmpty()
        .withMessage("Specialization is required")
        .custom(async value => {
            if (!Object.values(specializationsEnum).includes(value)) {
                throw new Error("Invalid specialization");
            }
            return true;
        })
        .withMessage("Invalid specialization")
];

const validationLogin = [
    check("email")
        .isEmail()
        .withMessage("Enter a valid email address")
        .normalizeEmail(),
    check("password").not().isEmpty()
];

const  { 
    isDeveloper,
    isAdmin,
} = require('../controllers/developer')

router.get("/isDeveloper", Verify, isDeveloper);
router.get("/isAdmin", Verify, VerifyRole, isAdmin);
router.post("/login", validationLogin, Validate, Login);
router.post("/register", validationRegister, Validate, Register);
router.get("/logout", Verify, Logout);

module.exports = router;