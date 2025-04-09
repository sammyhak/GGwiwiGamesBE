const { signup, login, profile_update } = require('../Controllers/AuthController');
const { signupValidation, loginValidation } = require("../Middlewares/AuthValidation")
const multer=require("multer")
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer=require("nodemailer");
const usermodel = require("../Models/User")
const ensureAuthenticated = require('../Middlewares/Auth');

// Custom word-based ID generator (adjust words as needed)
const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
const generatePlayerId = () => {
    return Array.from({ length: 3 }, () => words[Math.floor(Math.random() * words.length)]).join('-');
};

// ------------file-upload----------
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/images")
    },
    filename:function(req,file,cb){
        cb(null,`${Date.now()}_${file.originalname}`)
    }

});
const uploadimage=multer({storage:storage});

router.post('/login', login);

router.post('/signup', async (req, res) => {
    try {
        const { firstName, surname, email, country, currency, phoneNumber, password, promoCode,bonusSelection } = req.body;

        // Check if user already exists
        const existingUser = await usermodel.findOne({ phoneNumber, email });
        if (existingUser) {
            return res.send({ message: 'User already exists, you can log in', success: false });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique 9-word player ID
        const player_id = generatePlayerId();

        // Create new user
        const newUser = new usermodel({
            firstName,
            surname,
            email,
            country,
            currency,
            phoneNumber,
            promoCode,
            password: hashedPassword,
            bonusSelection:bonusSelection,
            player_id, // Assigning unique player ID
        });

        await newUser.save();
        console.log(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, phoneNumber: newUser.phoneNumber, email: newUser.email },
            process.env.JWT_SECRET, // Use a secret key from .env
            { expiresIn: '7d' } // Token expires in 7 days
        );

        res.send({
            message: 'Signup successful',
            success: true,
            token, // Return token
            user: newUser,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Internal server error',
            success: false,
        });
    }
});
router.put("/update-profile",ensureAuthenticated,profile_update)
module.exports = router;