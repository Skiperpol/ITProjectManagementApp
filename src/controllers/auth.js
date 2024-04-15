const bcrypt = require('bcrypt')
const Developer = require('../models/developer')

async function Register(req, res) {
    const { projectId, first_name, last_name, email, password, specialization, role } = req.body;
    try {
        const newDeveloper = new Developer({
            projectId,
            first_name,
            last_name,
            email,
            password,
            specialization,
            role
        });
        const existingDeveloper = await Developer.findOne({ email });
        if (existingDeveloper)
            return res.status(400).json({
                status: "failed",
                data: [],
                message: "It seems you already have an account, please log in instead.",
            });
        const savedDeveloper = await newDeveloper.save(); // Save new user into the database
        res.status(200).json({
            status: "success",
            data: [savedDeveloper._doc],
            message:
                "Thank you for registering with us. Your account has been successfully created.",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: "Internal Server Error: " + err.message,
        });
    }
    res.end();
}

async function Login(req, res) {
    const { email } = req.body;
    try {
        const developer = await Developer.findOne({ email }).select("+password");
        if (!developer)
            return res.status(401).json({
                status: "failed",
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            });
        const isPasswordValid = bcrypt.compare(
            `${req.body.password}`,
            developer.password
        );
        if (!isPasswordValid)
            return res.status(401).json({
                status: "failed",
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            });
            let options = {
                maxAge: 20 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: "None",
            };
            const token = developer.generateAccessJWT();
            res.cookie("SessionID", token, options);
            res.status(200).json({
                status: "success",
                message: "You have successfully logged in.",
            });
        } catch (err) {
            res.status(500).json({
                status: "error",
                code: 500,
                data: [],
                message: "Internal Server Error: " + err.message,
            });
        }
    res.end();
}

async function Logout(req, res) {
  try {
    const authHeader = req.headers['cookie'];
    if (!authHeader) return res.sendStatus(204);
    res.clearCookie('SessionID');
    res.status(200).json({ message: 'You are logged out!' });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: "Internal Server Error: " + err.message,
    });
  }
  res.end();
}

module.exports = {
    Register,
    Login,
    Logout
  };