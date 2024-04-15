const jwt = require("jsonwebtoken")
const Developer = require("../models/developer")
const { SECRET_ACCESS_TOKEN } = require("../configs/environments")

async function Verify(req, res, next) {
    try {
        const authHeader = req.headers["cookie"];
        if (!authHeader) return res.sendStatus(401); 
        const cookie = authHeader.split("=")[1];

        jwt.verify(cookie, SECRET_ACCESS_TOKEN, async (err, decoded) => {
            if (err) {
                return res
                    .status(401)
                    .json({ message: "This session has expired. Please login" });
            }

            const { id } = decoded;
            const developer = await Developer.findById(id);
            if (!developer) {
                return res.status(404).json({ message: "Developer not found." });
            }
            const { password, ...data } = developer._doc;
            req.developer = data;
            next();
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: err.message,
        });
    }
}

function VerifyRole(req, res, next) {
    try {
        const developer = req.developer;
        const { role } = developer;
        if (role !== "admin") {
            return res.status(401).json({
                status: "failed",
                message: "You are not authorized to view this page.",
            });
        }
        next();
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: err.message,
        });
    }
}

module.exports = { Verify, VerifyRole };