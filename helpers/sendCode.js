const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  auth: {
    user: "mohamad4112002@gmail.com",
    pass: "pktixjhmeunfksyc",
  },
});

async function sendCode(to, subject, text, html) {
  const info = await transporter.sendMail({
    from: "mohamad4112002@gmail.com",
    to,
    subject,
    text,
    html
  });
}

module.exports = {sendCode};