const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors({ origin: '*' }));
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

mongoose.connect("mongodb+srv://mohamad:12345@main.wqcobwl.mongodb.net/ByteMentors?retryWrites=true&w=majority");

const StudentModel = require('./models/Student');
const CompanyModel = require('./models/Company');
const { sendMail } = require('./helpers/sendMail');
const { sendCode } = require('./helpers/sendCode');

let sentCode = 99999;

app.get("/students", async (req, res) => {
  const student = await StudentModel.find();
  res.json(student);
});

app.get("/companies", async (req, res) => {
  const company = await CompanyModel.find();
  res.json(company);
});

app.post("/createstudent", async (req, res) => {
  const student = req.body;
  const existingStudent = await StudentModel.findOne({ email: student.email });
  const existingCompany = await CompanyModel.findOne({ email: student.email });

  if (existingStudent || existingCompany) {
    return res.status(400).json({ error: "Email already exists. Please use a different email." });
  }

  const newStudent = new StudentModel(student);
  await newStudent.save();
  sendMail(newStudent.email, "Welcome to our Website", `Hi ${newStudent.name}, Thank you for registering! Enjoy using Byte Mentor's.`);
  res.json(student);
});

app.post("/createcompany", async (req, res) => {
  const company = req.body;
  const existingStudent = await StudentModel.findOne({ email: company.email });
  const existingCompany = await CompanyModel.findOne({ email: company.email });

  if (existingStudent || existingCompany) {
    return res.status(400).json({ error: "Email already exists. Please use a different email." });
  }

  const newCompany = new CompanyModel(company);
  await newCompany.save();
  sendMail(newCompany.email, "Welcome to our Website", `Hi ${newCompany.companyName}, Thank you for registering! Enjoy using Byte Mentor's.`);
  res.json(company);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await StudentModel.findOne({ email, password });
    const company = await CompanyModel.findOne({ email, password });

    if (student) {
      res.json({ success: true, userType: 'student' });
    } else if (company) {
      res.json({ success: true, userType: 'company' });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ success: false, error: "An error occurred while logging in" });
  }
});

app.post("/forgetpassword", async (req, res) => {
  const { email } = req.body;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student || company) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      sentCode = randomCode;

      sendCode(email, "Password Reset Code", `Your password reset code is: ${sentCode}`).then(() => {
        res.json({ success: true, code: randomCode });
      });
    } else {
      res.status(404).json({ success: false, error: "Email not found" });
    }
  } catch (error) {
    console.error("Error sending reset code:", error);
    res.status(500).json({ success: false, error: "An error occurred while sending reset code" });
  }
});

app.post("/forgetcode/verify", async (req, res) => {
  const { email, code } = req.body;

  try {
    if (code === sentCode.toString()) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Invalid verification code" });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ success: false, error: "An error occurred while verifying code" });
  }
});

app.post("/resetpassword", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await StudentModel.findOneAndUpdate({ email }, { password });
    const company = await CompanyModel.findOneAndUpdate({ email }, { password });

    if (student || company) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Email not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "An error occurred while resetting password" });
  }
});

app.post("/changepassword", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student || company) {
      // Check if current password matches in backend
      if (currentPassword !== (student ? student.password : company.password)) {
        return res.status(400).json({ success: false, error: "Current password is incorrect" });
      }

      // If yes, update the password
      const updatedUser = await (student || company).updateOne({ password: newPassword });

      if (updatedUser) {
        return res.json({ success: true, message: "Password updated successfully" });
      } else {
        return res.status(500).json({ success: false, error: "An error occurred while updating the password" });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "An error occurred while changing the password" });
  }
});

app.get("/getname", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student) {
      res.json({ name: student.name });
    } else if (company) {
      res.json({ name: company.companyName });
    } else {
      res.status(404).json({ name: null });
    }
  } catch (error) {
    res.status(500).json({ name: null, error: "An error occurred while fetching name" });
  }
});

app.get("/getcity", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student) {
      res.json({ city: student.city });
    } else if (company) {
      res.json({ city: company.city });
    } else {
      res.status(404).json({ city: null });
    }
  } catch (error) {
    res.status(500).json({ city: null, error: "An error occurred while fetching city" });
  }
});

app.get("/getphonenumber", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student) {
      res.json({ phoneNumber: student.phoneNumber });
    } else if (company) {
      res.json({ phoneNumber: company.phoneNumber });
    } else {
      res.status(404).json({ phoneNumber: null });
    }
  } catch (error) {
    res.status(500).json({ phoneNumber: null, error: "An error occurred while fetching phone Number" });
  }
});

app.get("/getdescription", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student) {
      res.json({ description: student.bio });
    } else if (company) {
      res.json({ description: company.description });
    } else {
      res.status(404).json({ description: null });
    }
  } catch (error) {
    res.status(500).json({ description: null, error: "An error occurred while fetching description" });
  }
});

app.get("/getlinkedin", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student) {
      res.json({ linkedin: student.linkedin });
    } else if (company) {
      res.json({ linkedin: company.linkedin });
    } else {
      res.status(404).json({ linkedin: null });
    }
  } catch (error) {
    res.status(500).json({ linkedin: null, error: "An error occurred while fetching linkedin" });
  }
});

app.get("/getprofileimage", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });

    if (student) {
      res.json({ profileImage: student.profileImage });
    } else if (company) {
      res.json({ profileImage: company.profileImage });
    } else {
      res.status(404).json({ profileImage: null });
    }
  } catch (error) {
    res.status(500).json({ profileImage: null, error: "An error occurred while fetching Profile Image" });
  }
});

app.get("/getgraduate", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });

      if (student) {
        res.json({ graduate : student.graduate });
      } else if (company) {
        res.json({ graduate: null });
      } else {
        res.status(404).json({ graduate: null });
      }
    } catch (error) {
      res.status(500).json({ graduate: null, error: "An error occurred while fetching Graduate" });
    }
  });
  app.get("/getuniversity", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
  
      if (student) {
        res.json({ university: student.university });
      } else if (company) {
        res.json({ university: null });
      } else {
        res.status(404).json({ university: null });
      }
    } catch (error) {
      res.status(500).json({ university: null, error: "An error occurred while fetching university" });
    }
  });
  app.get("/getgraduationyear", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
  
      if (student) {
        res.json({ graduationyear: student.graduationYear });
      } else if (company) {
        res.json({ graduationyear: null });
      } else {
        res.status(404).json({ graduationyear: null });
      }
    } catch (error) {
      res.status(500).json({ graduationyear: null, error: "An error occurred while fetching graduation year" });
    }
  });
app.get("/getgithub", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
  
      if (student) {
        res.json({ github: student.github });
      } else if (company) {
        res.json({ github: null });
      } else {
        res.status(404).json({ github: null });
      }
    } catch (error) {
      res.status(500).json({ github: null, error: "An error occurred while fetching Github" });
    }
  });
  

  app.get("/getgender", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
  
      if (student) {
        res.json({ gender: student.gender });
      } else if (company) {
        res.json({ gender: null });
      } else {
        res.status(404).json({ gender: null });
      }
    } catch (error) {
      res.status(500).json({ gender: null, error: "An error occurred while fetching Gender" });
    }
  });
  app.get("/getpreferredfield", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
  
      if (student) {
        res.json({ preferredField: student.preferredField });
      } else if (company) {
        res.json({ preferredField: null });
      } else {
        res.status(404).json({ preferredField: null });
      }
    } catch (error) {
      res.status(500).json({ preferredField: null, error: "An error occurred while fetching Preferred Field" });
    }
  });

  app.get("/getskill", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
  
      if (student) {
        res.json({ skill: student.skills });
      } else if (company) {
        res.json({ skill: null });
      } else {
        res.status(404).json({ skill: null });
      }
    } catch (error) {
      res.status(500).json({ skill: null, error: "An error occurred while fetching skills" });
    }
  });


app.post('/updateCompanyInfo', async (req, res) => {
    try {
      const { email, ...updatedInfo } = req.body;
  
      // Update company info in the database
      const updatedCompany = await CompanyModel.findOneAndUpdate({ email }, { $set: updatedInfo }, { new: true });
  
      if (updatedCompany) {
        res.status(200).json({ success: true, message: 'Company info updated successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Email not found' });
      }
    } catch (error) {
      console.error("Error updating company info:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });
  app.post('/updateStudentInfo', async (req, res) => {
    try {
      const { email, ...updatedInfo } = req.body;
  
      // التحقق من وجود البريد الإلكتروني قبل التحديث
      const existingStudent = await StudentModel.findOne({ email });
  
      if (!existingStudent) {
        return res.status(404).json({ success: false, error: 'Email not found' });
      }
  
      // تحديث معلومات الطالب في قاعدة البيانات
      const updatedStudent = await StudentModel.findOneAndUpdate(
        { email },
        { $set: updatedInfo },
        { new: true }
      );
  
      if (updatedStudent) {
        res.status(200).json({ success: true, message: 'Student info updated successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Email not found' });
      }
    } catch (error) {
      console.error("Error updating student info:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });
  
app.listen("3001", () => {
  console.log("server worked!");
});
