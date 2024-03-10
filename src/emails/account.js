const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "youremail@example.com",
    pass: "YOUR_EMAIL_PASSWORD",
  },
});

async function sendWelcomeEmail(email, name) {
  const result = await transporter.sendMail({
    from: "youremail@example.com",
    to: email,
    subject: `Welcome, ${name}`,
    html: `<p>Dear ${name}, <br>thank you for creating an account in my test nodejs app.</p><p>Have a great time using it! :)</p>`,
  });

  console.log(JSON.stringify(result, null, 4));
}

async function sendCancellationEmail(email, name) {
  const result = await transporter.sendMail({
    from: "youremail@example.com",
    to: email,
    subject: "Your account has been removed",
    html: `<p>Dear ${name}, <br>your account has been removed successfully.</p><p>Thank you for helping me out with my nodejs course! :)<br> Best regards, <br>O.K.</p>`,
  });

  console.log(JSON.stringify(result, null, 4));
}

module.exports = { sendWelcomeEmail, sendCancellationEmail };
