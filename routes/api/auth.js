const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

//@route    GET api/auths
//@desc     Test rout
//@access   public

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user)
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error")
    }
})

//@route    POST api/auth
//@desc     authenticationg the usrer & get token
//@access   public

router.post('/', [
    check('email', 'email is required').isEmail(),
    check('password', 'Bad Password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(400)
            .json({ errors: errors.array() })
    }

    //destructuring the req array
    const { email, password } = req.body;

    try {
        //See if user exists
        let user = await User.findOne({ email })
        if (!user) {
            return res
                .status(400)
                .json({ errors: [{ msg: 'invalid credential' }] })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ errors: [{ msg: 'invalid credential' }] })
        }

        //Return jsonWebtoken
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(payload,
            config.get('jwtSecret'), {
            expiresIn: 360000
        },
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            }
        )
        // res.send("User Registed Sucessfully")
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }

})

module.exports = router;