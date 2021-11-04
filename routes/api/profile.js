const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const profile = require('../../models/Profile')
const user = require('../../models/User')
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

//@route    GET api/profile/me
//@desc     Get current users profile
//@access   Private

router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile
            .findOne({ user: req.user.id })
            .populate('user', ['name', 'avatar']);
        if (!profile) {
            return res
                .status(400)
                .json({ msg: "there is no profile for user" });
        }
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route    POST api/profile/
//@desc     Create or update a user profile
//@access   Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'skills is required').not().isEmpty()
]], async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() })
    }
    const {
        company, website, location, bio, status, githubusername, skills, youtube, facebook, instagram, linkedin
    } = req.body;

    //build profile object
    const profileFields = {}
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map((element) => element.trim());
    }
    //social object bulding
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (instagram) profileFields.social.instagram = instagram
    if (linkedin) profileFields.social.linkedin = linkedin

    try {
        let profile = await Profile.findOne({ user: req.user.id })

        if (profile) {
            //update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            )
            return res.json(profile)
        }
        //create
        profile = new Profile(profileFields);
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route    GET api/profile/
//@desc     get all profile 
//@access   public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

//@route    GET api/profile/user/user_id
//@desc     get paticular profile by id 
//@access   public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile)
            return res.status(400).json({ msg: "Profile not found!" })
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: "Profile not found!" })
        }
        res.status(500).send("Server Error")
    }
})


//@route   DELETE api/profile/
//@desc    delete profile 
//@access  private

router.delete('/', auth, async (req, res) => {
    try {
        //remove profile
        await Profile.findOneAndRemove({ user: req.user.id })
        //remove the user
        await User.findOneAndRemove({ _id: req.user.id })
        res.json({ msg: "user deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

//@route   PUT api/profile/experience
//@desc    add profile experience 
//@access  private

router.put('/experience', [auth, [
    check('title', 'title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty(),
]], async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { title, company, location, from, to, current, description } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


//@route   DELETE api/profile/experience/:exp_id
//@desc    delete profile experience from profile
//@access  private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        //get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
})


module.exports = router;