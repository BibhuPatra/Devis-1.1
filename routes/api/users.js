const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const User = require('../../models/User')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

//@route    POST api/users
//@desc     register user
//@access   public

router.post('/', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'email is required').isEmail(),
    check('password', 'password is required of min 6 or more character').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    //destructuring the req array
    const { name, email, password } = req.body;

    try {
        //See if user exists
        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] })
        }
        //get user gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name, email, avatar, password
        })

        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt)
        //save bcrypt password to the database
        await user.save()
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
        res.status(500).send('Server Error')
    }

})
module.exports = router;