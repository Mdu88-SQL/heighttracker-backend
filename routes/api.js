var express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
var router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,         // Your Gmail address
        pass: process.env.EMAIL_PASS, // App password
    },
});

mongoose.connect('mongodb+srv://nmduduzi735:3Ou4Sxz187hjt2PY@cluster0.pokuats.mongodb.net/htdb?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('✅ MongoDB connected'));

const UserSchema = new mongoose.Schema({
    email: String,
    name: String,
    heights:[Number],
});

const User = mongoose.model('User',UserSchema);

router.post('/', async (req, res, next) => {
    const { name, email,height } = req.body;

    const user = await User.findOneAndUpdate(
        { email },
        {
            $set: { name },
            $push: { heights: height }
        },
        {
            upsert: true,
            new: true
        }
    );
    const average = user.heights.reduce((sum, num) => sum + num, 0) / user.heights.length;
    console.log(average);


    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Height Submission Results",
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4F46E5;">Hi ${name},</h2>
      <p style="font-size: 16px;">Thanks for submitting your height to <strong>Height Tracker</strong>!</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; background: #f9f9f9;"><strong>Latest Height:</strong></td>
          <td style="padding: 10px;">${height} cm</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f9f9f9;"><strong>Average Height:</strong></td>
          <td style="padding: 10px;">${average.toFixed(2)} cm</td>
        </tr>
      </table>

      <p style="margin-top: 20px; font-size: 14px; color: #888;">
        This is an automated message from Height Tracker.
      </p>
    </div>
  `
    });


    res.status(200).json(user);
});

module.exports = router;