const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  auth: {
    user: "bytementor6@gmail.com",
    pass: "esak qdzh adel pmcy",
  },
});

async function sendMail(to, subject, text, html) {
  const info = await transporter.sendMail({
    from: "bytementor6@gmail.com",
    to,
    subject,
    text,
    html
  });
}

module.exports = {sendMail};