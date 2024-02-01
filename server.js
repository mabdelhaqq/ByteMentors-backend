const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors({ origin: '*' }));
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cron = require('node-cron');


mongoose.connect("mongodb+srv://mohamad:12345@main.wqcobwl.mongodb.net/ByteMentors?retryWrites=true&w=majority");

const StudentModel = require('./models/Student');
const CompanyModel = require('./models/Company');
const AdminModel = require('./models/Admin');
const OpportunityModel = require('./models/Opportunity');
const PlanModel = require('./models/Plan');
const NotificationModel = require('./models/Notification');
const { sendMail } = require('./helpers/sendMail');

let sentCode = 99999;

app.get("/students", async (req, res) => {
  const student = await StudentModel.find();
  res.json(student);
});

app.get("/companies", async (req, res) => {
  const company = await CompanyModel.find();
  res.json(company);
});
app.get("/opps", async (req, res) => {
  const opportunity = await OpportunityModel.find();
  res.json(opportunity);
});
app.get("/opportunities", async (req, res) => {
  try {
    const currentDateTime = new Date();
    const opportunities = await OpportunityModel.find({
      deadline: { $gte: currentDateTime }
    });
    res.json(opportunities);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get("/opportunitiesd", async (req, res) => {
  try {
    const currentDateTime = new Date();
    const opportunities = await OpportunityModel.find({
      deadline: { $gte: currentDateTime }
    });
    res.json(opportunities);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/admins", async (req, res) => {
  const admin = await AdminModel.find();
  res.json(admin);
});
app.get("/plans", async (req, res) => {
  const plan = await PlanModel.find();
  res.json(plan);
});
app.get("/notifications", async (req, res) => {
  const notification = await NotificationModel.find();
  res.json(notification);
});

app.post("/createstudent", async (req, res) => {
  const studentData = req.body;
  const existingStudent = await StudentModel.findOne({ email: studentData.email });
  const existingCompany = await CompanyModel.findOne({ email: studentData.email });
  const existingAdmin = await AdminModel.findOne({ email: studentData.email });

  if (existingStudent || existingCompany || existingAdmin) {
    return res.status(400).json({ error: "Email already exists. Please use a different email." });
  }
  const hashedPassword = await bcrypt.hash(studentData.password, 10);
  studentData.password = hashedPassword;
  const newStudent = new StudentModel(studentData);
  await newStudent.save();
  sendMail(newStudent.email, "Welcome to our Website", `Hi ${newStudent.name}, Thank you for registering! Enjoy using Byte Mentor's.`);
  res.json(newStudent);
});
app.post("/createcompany", async (req, res) => {
  const companyData = req.body;
  const existingStudent = await StudentModel.findOne({ email: companyData.email });
  const existingCompany = await CompanyModel.findOne({ email: companyData.email });
  const existingAdmin = await AdminModel.findOne({ email: companyData.email });

  if (existingStudent || existingCompany || existingAdmin) {
    return res.status(400).json({ error: "Email already exists. Please use a different email." });
  }
  const hashedPassword = await bcrypt.hash(companyData.password, 10);
  companyData.password = hashedPassword;

  const newCompany = new CompanyModel(companyData);
  await newCompany.save();
  sendMail(newCompany.email, "Welcome to our Website", `Hi ${newCompany.companyName}, Thank you for registering! Enjoy using Byte Mentor's.`);
  res.json(newCompany);
});
app.post('/addAdmin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingAdmin = await AdminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "An admin with this email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new AdminModel({
      email,
      password: hashedPassword
    });
    await newAdmin.save();
    await sendMail(
      email, 
      "Welcome to ByteMentors as an Admin", 
      `You are now an admin in ByteMentors. Your password is: ${password}. Please change your password upon first login.`, 
      `<p>You are now an admin in ByteMentors. Your password is: <strong>${password}</strong>. Please change your password upon first login.</p>`
    );

    res.status(201).json({ success: true, message: "New admin added successfully." });
  } catch (error) {
    console.error('Error adding new admin', error);
    res.status(500).json({ success: false, message: "An error occurred while adding a new admin." });
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await StudentModel.findOne({ email });
    if (student && await bcrypt.compare(password, student.password)) {
      return res.json({ success: true, userType: 'student' });
    }
    const company = await CompanyModel.findOne({ email });
    if (company && await bcrypt.compare(password, company.password)) {
      return res.json({ success: true, userType: 'company' });
    }
    const admin = await AdminModel.findOne({ email });
    if (admin) {
      const isPasswordHashed = admin.password.startsWith('$2b$');
      if (isPasswordHashed && await bcrypt.compare(password, admin.password)) {
        return res.json({ success: true, userType: 'admin' });
      } else if (!isPasswordHashed && password === admin.password) {
        return res.json({ success: true, userType: 'admin' });
      }
    }

    res.json({ success: false, message: "Invalid email or password" });
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
    const admin = await AdminModel.findOne({ email });

    if (student || company || admin) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      sentCode = randomCode;
      sendMail(email, "Password Reset Code", `Your password reset code is: ${sentCode}`).then(() => {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await StudentModel.findOneAndUpdate({ email }, { password: hashedPassword });
    const company = await CompanyModel.findOneAndUpdate({ email }, { password: hashedPassword });
    const admin = await AdminModel.findOneAndUpdate({ email }, { password: hashedPassword });

    if (student || company || admin) {
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
    let user = await StudentModel.findOne({ email }) || await CompanyModel.findOne({ email });
    let userType = "studentOrCompany";
    
    if (!user) {
      user = await AdminModel.findOne({ email });
      userType = "admin";
    }

    if (!user) {
      return res.status(400).json({ success: false, error: "Email not found" });
    }

    const isMatch = userType === "admin" ? 
                    (user.password === currentPassword || await bcrypt.compare(currentPassword, user.password)) :
                    await bcrypt.compare(currentPassword, user.password);

    if (isMatch) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await user.updateOne({ password: hashedNewPassword });
      res.json({ success: true, message: "Password updated successfully" });
    } else {
      res.status(400).json({ success: false, error: "Current password is incorrect" });
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
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ name: student.name });
    } else if (company) {
      res.json({ name: company.companyName });
    } else if (admin) {
      res.json({ name: null });
    } else {
      res.status(404).json({ name: null });
    }
  } catch (error) {
    res.status(500).json({ name: null, error: "An error occurred while fetching name" });
  }
});
app.get("/getid", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ _id: student._id });
    } else if (company) {
      res.json({ _id: company._id });
    } else if (admin) {
      res.json({ _id: admin._id });
    } else {
      res.status(404).json({ _id: null });
    }
  } catch (error) {
    res.status(500).json({ _id: null, error: "An error occurred while fetching id" });
  }
});

app.get("/getcity", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ city: student.city });
    } else if (company) {
      res.json({ city: company.city });
    } else if (admin) {
      res.json({ city: null });
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
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ phoneNumber: student.phoneNumber });
    } else if (company) {
      res.json({ phoneNumber: company.phoneNumber });
    } else if (admin) {
      res.json({ phoneNumber: null });
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
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ description: student.bio });
    } else if (company) {
      res.json({ description: company.description });
    } else if (admin) {
      res.json({ description: null });
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
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ linkedin: student.linkedin });
    } else if (company) {
      res.json({ linkedin: company.linkedin });
    } else if (admin) {
      res.json({ linkedin: null });
    } else {
      res.status(404).json({ linkedin: null });
    }
  } catch (error) {
    res.status(500).json({ linkedin: null, error: "An error occurred while fetching linkedin" });
  }
});

 app.get("/getwebsite", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ website: null });
      } else if (company) {
        res.json({ website: company.website });
      } else if (admin) {
        res.json({ website: null });
      } else {
        res.status(404).json({ website: null });
      }
    } catch (error) {
      res.status(500).json({ website: null, error: "An error occurred while fetching website" });
    }
  });

app.get("/getprofileimage", async (req, res) => {
  const { email } = req.query;

  try {
    const student = await StudentModel.findOne({ email });
    const company = await CompanyModel.findOne({ email });
    const admin = await AdminModel.findOne({ email });

    if (student) {
      res.json({ profileImage: student.profileImage });
    } else if (company) {
      res.json({ profileImage: company.profileImage });
    } else if (admin) {
      res.json({ profileImage: null });
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
      const admin = await AdminModel.findOne({ email });

      if (student) {
        res.json({ graduate : student.graduate });
      } else if (company) {
        res.json({ graduate: null });
      } else if (admin) {
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
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ university: student.university });
      } else if (company) {
        res.json({ university: null });
      } else if (admin) {
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
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ graduationyear: student.graduationYear });
      } else if (company) {
        res.json({ graduationyear: null });
      } else if (admin) {
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
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ github: student.github });
      } else if (company) {
        res.json({ github: null });
      } else if (admin) {
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
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ gender: student.gender });
      } else if (company) {
        res.json({ gender: null });
      } else if (admin) {
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
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ preferredField: student.preferredField });
      } else if (company) {
        res.json({ preferredField: null });
      } else if (admin) {
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
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ skill: student.skills });
      } else if (company) {
        res.json({ skill: null });
      } else if (admin) {
        res.json({ skill: null });
      } else {
        res.status(404).json({ skill: null });
      }
    } catch (error) {
      res.status(500).json({ skill: null, error: "An error occurred while fetching skills" });
    }
  });

  app.get("/getcv", async (req, res) => {
    const { email } = req.query;
  
    try {
      const student = await StudentModel.findOne({ email });
      const company = await CompanyModel.findOne({ email });
      const admin = await AdminModel.findOne({ email });
  
      if (student) {
        res.json({ cv: student.cv });
      } else if (company) {
        res.json({ cv: company.cv });
      } else if (admin) {
        res.json({ cv: null });
      } else {
        res.status(404).json({ cv: null });
      }
    } catch (error) {
      res.status(500).json({ cv: null, error: "An error occurred while fetching Cv" });
    }
  });

app.post('/updateCompanyInfo', async (req, res) => {
    try {
      const { email, ...updatedInfo } = req.body;
  
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
  app.post('/updateStudentInfo', upload.single('cv'), async (req, res) => {
      try {
      const { email, ...updatedInfo } = req.body;
  
      const updatedStudent = await StudentModel.findOneAndUpdate({ email }, { $set: updatedInfo }, { new: true });
  
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
  app.put('/updateStudent/:id', async (req, res) => {
    const _id = req.params.id;
    const updatedData = req.body;

    try {
        const updatedStudent = await StudentModel.findByIdAndUpdate(_id, updatedData, { new: true });
        
        if (updatedStudent) {
            res.json({ success: true, student: updatedStudent });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.put('/updateCompany/:id', async (req, res) => {
  const _id = req.params.id;
  const updatedData = req.body;

  try {
      const updatedCompany = await CompanyModel.findByIdAndUpdate(_id, updatedData, { new: true });
      
      if (updatedCompany) {
          res.json({ success: true, company: updatedCompany });
      } else {
          res.status(404).json({ success: false, message: 'Company not found' });
      }
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
});
  app.post('/addOpportunity', async (req, res) => {
    try {
      const { companyId, field, deadline, description } = req.body;
      const existingOpportunity = await OpportunityModel.findOne({
        companyId,
        field,
        deadline,
      });
      if (existingOpportunity) {
        return res.status(400).json({ success: false, error: 'Opportunity already exists' });
      }
      const newOpportunity = new OpportunityModel({
        companyId,
        field,
        deadline,
        description,
      });      
      await newOpportunity.save();
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error adding opportunity', error);
      res.status(500).json({ success: false, error: 'Failed to add opportunity' });
    }
  });
    
  app.post('/addPlan', async (req, res) => {
    try {
      const { adminId, field, description } = req.body;
      const normalizedField = field.replace(/\s+/g, '').toLowerCase(); // إزالة جميع الفراغات
  
      const existingPlan = await PlanModel.findOne({ field: new RegExp(`^${normalizedField}$`, 'i') });
      if (existingPlan) {
        return res.status(400).json({ success: false, error: 'Plan already exists' });
      }
  
      const newPlan = new PlanModel({
        adminId,
        field: normalizedField,
        description,
      });      
      await newPlan.save();
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error adding plan', error);
      res.status(500).json({ success: false, error: 'Failed to add plan' });
    }
  });
  

  app.get("/opportunity/:id", async (req, res) => {
    const opportunityId = req.params.id;
  
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);
  
      if (opportunity) {
        res.json({ success: true, opportunity });
      } else {
        res.status(404).json({ success: false, error: "Opportunity not found" });
      }
    } catch (error) {
      console.error("Error fetching opportunity details", error);
      res.status(500).json({ success: false, error: "An error occurred while fetching opportunity details" });
    }
  });
  app.get("/plans/:id", async (req, res) => {
    const planId = req.params.id;
  
    try {
      const plan = await PlanModel.findById(planId);
  
      if (plan) {
        res.json({ success: true, plan });
      } else {
        res.status(404).json({ success: false, error: "plan not found" });
      }
    } catch (error) {
      console.error("Error fetching plan details", error);
      res.status(500).json({ success: false, error: "An error occurred while fetching plan details" });
    }
  });
  app.get("/company/:id", async (req, res) => {
    const companyId = req.params.id;
  
    try {
      const company = await CompanyModel.findById(companyId);
  
      if (company) {
        res.json({ success: true, company });
      } else {
        res.status(404).json({ success: false, error: "company not found" });
      }
    } catch (error) {
      console.error("Error fetching company details", error);
      res.status(500).json({ success: false, error: "An error occurred while fetching company details" });
    }
  });

  app.get("/student/:id", async (req, res) => {
    const studentId = req.params.id;
  
    try {
      const student = await StudentModel.findById(studentId);
  
      if (student) {
        res.json({ success: true, student });
      } else {
        res.status(404).json({ success: false, error: "Student not found" });
      }
    } catch (error) {
      console.error("Error fetching student details", error);
      res.status(500).json({ success: false, error: "An error occurred while fetching student details" });
    }
  });
  app.delete("/plan/:id", async (req, res) => {
    const planId = req.params.id;
  
    try {
      const deletedPlan = await PlanModel.findByIdAndDelete(planId);
      if (deletedPlan) {
        res.json({ success: true, message: "Plan deleted successfully" });
      } else {
        res.status(404).json({ success: false, error: "Plan not found" });
      }
    } catch (error) {
      console.error("Error deleting plan", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting plan" });
    }
  });
  app.delete("/student/:id", async (req, res) => {
    const studentId = req.params.id;
  
    try {
      const student = await StudentModel.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, error: "Student not found" });
      }
      const opportunitiesToUpdate = await OpportunityModel.find({ 'applicants.studentId': studentId });
      await Promise.all(opportunitiesToUpdate.map(async (opportunity) => {
        await OpportunityModel.findByIdAndUpdate(opportunity._id, {
          $pull: { 'applicants': { 'studentId': studentId } },
          $inc: { 'submitterCount': -1 }
        });
      }));
          await StudentModel.findByIdAndDelete(studentId);
        await sendMail(
        student.email, 
        "Account Deletion", 
        "Your account has been deleted due to violation of our terms.", 
        "<p>Your account has been deleted due to violation of our terms.</p>"
      );
  
      res.json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting student" });
    }
  });
  app.delete("/opportunity/:id", async (req, res) => {
    const opportunityId = req.params.id;
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);
      if (!opportunity) {
        return res.status(404).json({ success: false, error: "Opportunity not found" });
      }
      const company = await CompanyModel.findById(opportunity.companyId);
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
      await OpportunityModel.findByIdAndDelete(opportunityId);
      await sendMail(
        company.email, 
        "Opportunity Deletion", 
        `Your opportunity '${opportunity.field}' has been deleted due to violation of our terms.`,
        `<p>Your opportunity '${opportunity.field}' has been deleted due to violation of our terms.</p>`
      );
      res.json({ success: true, message: "Opportunity deleted successfully" });
    } catch (error) {
      console.error("Error deleting opportunity", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting opportunity" });
    }
  });
  app.delete("/opportunitye/:id", async (req, res) => {
    const opportunityId = req.params.id;
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);
      if (!opportunity) {
        return res.status(404).json({ success: false, error: "Opportunity not found" });
      }

      await OpportunityModel.findByIdAndDelete(opportunityId);
      res.json({ success: true, message: "Opportunity deleted successfully" });
    } catch (error) {
      console.error("Error deleting opportunity", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting opportunity" });
    }
  });
  app.delete("/studente/:id", async (req, res) => {
    const studentId = req.params.id;
    try {
      const student = await StudentModel.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, error: "Student not found" });
      }
      const opportunitiesToUpdate = await OpportunityModel.find({ 'applicants.studentId': studentId });
      await Promise.all(opportunitiesToUpdate.map(async (opportunity) => {
        await OpportunityModel.findByIdAndUpdate(opportunity._id, {
          $pull: { 'applicants': { 'studentId': studentId } },
          $inc: { 'submitterCount': -1 }
        });
      }));
        await StudentModel.findByIdAndDelete(studentId);
      await sendMail(
        student.email, 
        "Account Deletion", 
        "Your coYour account has been successfully deleted from our platform by your request or due to execution of your request.mpany account has been deleted due to violation of our terms.", 
        "<p>Your account has been successfully deleted from our platform by your request or due to execution of your request.</p>"
      );
      res.json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting student" });
    }
  });
  app.delete("/companye/:id", async (req, res) => {
    const companyId = req.params.id;
    try {
      const company = await CompanyModel.findById(companyId);
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }

      await CompanyModel.findByIdAndDelete(companyId);
      await OpportunityModel.deleteMany({ companyId: companyId });

      await sendMail(
        company.email, 
        "Account Deletion", 
        "Your account has been successfully deleted from our platform by your request or due to execution of your request.", 
        "<p>Your account has been successfully deleted from our platform by your request or due to execution of your request.</p>"
      );
      res.json({ success: true, message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting company" });
    }
  });
  app.delete("/admine/:id", async (req, res) => {
    const adminId = req.params.id;
    try {
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }

      await AdminModel.findByIdAndDelete(adminId);
      await sendMail(
        admin.email, 
        "Account Deletion", 
        "Your account has been successfully deleted from our platform by your request or due to execution of your request.", 
        "<p>Your account has been successfully deleted from our platform by your request or due to execution of your request.</p>"
      );
      res.json({ success: true, message: "Admin deleted successfully" });
    } catch (error) {
      console.error("Error deleting admin", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting admin" });
    }
  });

  
  app.delete("/company/:id", async (req, res) => {
    const companyId = req.params.id;
  
    try {
      const company = await CompanyModel.findById(companyId);
      if (!company) {
        return res.status(404).json({ success: false, error: "Company not found" });
      }
  
      await CompanyModel.findByIdAndDelete(companyId);
      await OpportunityModel.deleteMany({ companyId: companyId });
        await sendMail(
        company.email, 
        "Account Deletion", 
        "Your company account has been deleted due to violation of our terms.", 
        "<p>Your company account has been deleted due to violation of our terms.</p>"
      );
  
      res.json({ success: true, message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company", error);
      res.status(500).json({ success: false, error: "An error occurred while deleting company" });
    }
  });
  
  app.put('/editOpportunity/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { companyId, field, deadline, description } = req.body;
        const existingOpportunity = await OpportunityModel.findOne({
        _id: { $ne: id },
        companyId: req.body.companyId,
        field,
        deadline,
      });
  
      if (existingOpportunity) {
        return res.status(400).json({ success: false, error: 'Opportunity already exists' });
      }
  
      const updatedOpportunity = await OpportunityModel.findByIdAndUpdate(id, {
        companyId,
        field,
        deadline,
        description,
      });
  
      if (updatedOpportunity) {
        res.status(200).json({ success: true, updatedOpportunity });
      } else {
        res.status(404).json({ success: false, error: 'Opportunity not found' });
      }
    } catch (error) {
      console.error('Error editing opportunity', error);
      res.status(500).json({ success: false, error: 'Failed to edit opportunity' });
    }
  });
  

  app.put('/editPlan/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { field, description } = req.body;
      const normalizedField = field.replace(/\s+/g, '').toLowerCase();
        const existingPlan = await PlanModel.findOne({ 
        _id: { $ne: id }, 
        field: new RegExp(`^${normalizedField}$`, 'i') 
      });
  
      if (existingPlan) {
        return res.status(400).json({ success: false, error: 'Plan with this name already exists' });
      }
  
      const updatedPlan = await PlanModel.findByIdAndUpdate(id, { field: normalizedField, description });
      if (updatedPlan) {
        res.status(200).json({ success: true, updatedPlan });
      } else {
        res.status(404).json({ success: false, error: 'Plan not found' });
      }
    } catch (error) {
      console.error('Error editing plan', error);
      res.status(500).json({ success: false, error: 'Failed to edit plan' });
    }
  });
  app.get('/opportunitiesc', async (req, res) => {
    try {
      const companyId = req.query.companyId;
      const Opportunity = require('./models/Opportunity');
  
      const opportunities = await Opportunity.find({ companyId });
  
      res.json(opportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  // app.get('/notificationss', async (req, res) => {
  //   try {
  //     const studentId = req.query.studentId;
  //     const Notification = require('./models/Notification');
  //     const notifications = await Notification.find({ userId: studentId });  
  //     res.json(notifications);
  //   } catch (error) {
  //     console.error('Error fetching notifications:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // });
  app.get('/notificationss', async (req, res) => {
    try {
      const studentId = req.query.studentId;
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid or missing studentId' });
      }
      const Notification = require('./models/Notification');
      const notifications = await Notification.find({ userId: studentId });
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/notifications/markOpened/:notificationId', async (req, res) => {
    const { notificationId } = req.params;
  
    try {
      await NotificationModel.findByIdAndUpdate(notificationId, { opened: true });
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  app.post('/notifications/markAllAsRead/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      await NotificationModel.updateMany({ userId, isRead: false }, { isRead: true });
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error updating notifications:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  

  app.post('/opportunity/:id/apply', async (req, res) => {
    const opportunityId = req.params.id;
    const studentId = req.body.studentId;
  
    try {
      const opportunity = await OpportunityModel.findById(opportunityId);
      if (!opportunity) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
  
      const isAlreadyApplied = opportunity.applicants.some((applicant) => applicant.studentId.toString() === studentId.toString());
      if (isAlreadyApplied) {
        return res.status(400).json({ success: false, message: 'You have already applied for this opportunity' });
      }
  
      opportunity.applicants.push({ studentId });
      opportunity.submitterCount += 1;
      await opportunity.save();
  
      return res.status(200).json({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
      console.error('Error submitting application:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  app.get('/opportunity/:id/applicants', async (req, res) => {
    try {
      const opportunityId = req.params.id;
      const opportunity = await OpportunityModel.findById(opportunityId).populate({
        path: 'applicants.studentId',
        select: 'name email profileImage'
      });
  
      if (!opportunity) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
  
      const applicantsWithStatus = opportunity.applicants.map(applicant => {
        return {
          _id: applicant.studentId._id,
          name: applicant.studentId.name,
          email: applicant.studentId.email,
          profileImage: applicant.studentId.profileImage,
          status: applicant.status
        };
      });
  
      res.json(applicantsWithStatus);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.get('/student/:id/opportunities', async (req, res) => {
    const studentId = req.params.id;
    try {
      const opportunities = await OpportunityModel.find({ 'applicants.studentId': studentId })
        .populate('companyId')
        .lean();
  
      const opportunitiesWithStatusAndInterviewDetails = opportunities.map(opportunity => {
        const applicant = opportunity.applicants.find(a => a.studentId.toString() === studentId);
        if (applicant) {
          opportunity.applicantStatus = applicant.status;
          opportunity.interviewDetails = {
            type: applicant.interviewType,
            date: applicant.interviewDate,
            time: applicant.interviewTime,
            link: applicant.interviewLink,
            address: applicant.interviewAddress
          };
        } else {
          opportunity.applicantStatus = 'not_found';
        }
        
        return opportunity;
      });
  
      res.json({ success: true, opportunities: opportunitiesWithStatusAndInterviewDetails });
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  

  app.post('/opportunity/:opportunityId/reject/:studentId', async (req, res) => {
    const { opportunityId, studentId } = req.params;
  
    try {
      const opportunity = await OpportunityModel.findById(opportunityId).populate('companyId');
      if (!opportunity) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
  
      const applicantIndex = opportunity.applicants.findIndex(applicant => applicant.studentId.toString() === studentId);
      if (applicantIndex !== -1) {
        opportunity.applicants[applicantIndex].status = 'rejected';
        await opportunity.save();
  
        const company = await CompanyModel.findById(opportunity.companyId);
        if (!company) {
          return res.status(404).json({ success: false, message: 'Company not found' });
        }
  
        const notification = new NotificationModel({
          userId: studentId,
          onModel: 'Student',
          type: 'Opportunity Rejection',
          message: `Your application has been rejected for ${opportunity.field} Opportunity at ${company.companyName} Company`,
          isRead: false
        });
        await notification.save();
  
        res.json({ success: true, message: 'Applicant rejected successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Applicant not found' });
      }
    } catch (error) {
      console.error('Error updating applicant status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
    app.post('/opportunity/:opportunityId/accept/:studentId', async (req, res) => {
    const { opportunityId, studentId } = req.params;
    try {
      const opportunity = await OpportunityModel.findById(opportunityId).populate('companyId');
      if (!opportunity) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
      const applicantIndex = opportunity.applicants.findIndex(applicant => applicant.studentId.toString() === studentId);
      if (applicantIndex !== -1) {
        opportunity.applicants[applicantIndex].status = 'accepted';
        await opportunity.save();
  
        const company = await CompanyModel.findById(opportunity.companyId);
        if (!company) {
          return res.status(404).json({ success: false, message: 'Company not found' });
        }
  
        const notification = new NotificationModel({
          userId: studentId,
          onModel: 'Student',
          type: 'Opportunity Acceptance',
          message: `Your application has been accepted for ${opportunity.field} Opportunity at ${company.companyName} Company`,
          isRead: false
        });
        await notification.save();
  
        res.json({ success: true, message: 'Applicant accepted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Applicant not found' });
      }
    } catch (error) {
      console.error('Error updating applicant status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/opportunity/:opportunityId/waiting/:studentId', async (req, res) => {
    const { opportunityId, studentId } = req.params;
  
    try {
      const opportunity = await OpportunityModel.findById(opportunityId).populate('companyId');
      if (!opportunity) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
  
      const applicantIndex = opportunity.applicants.findIndex(applicant => applicant.studentId.toString() === studentId);
      if (applicantIndex !== -1) {
        opportunity.applicants[applicantIndex].status = 'waiting';
        await opportunity.save();
  
        const company = await CompanyModel.findById(opportunity.companyId);
        if (!company) {
          return res.status(404).json({ success: false, message: 'Company not found' });
        }
  
        const notification = new NotificationModel({
          userId: studentId,
          onModel: 'Student',
          type: 'Interview Scheduled',
          message: `An interview has been scheduled for you for the ${opportunity.field} opportunity at ${opportunity.companyId.companyName}.`,
          isRead: false
        });
        await notification.save();
  
        res.json({ success: true, message: 'Applicant rejected successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Applicant not found' });
      }
    } catch (error) {
      console.error('Error updating applicant status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });


  app.get('/notifications/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const notifications = await NotificationModel.find({ userId: userId }).exec();
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  cron.schedule('0 12 * * *', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    const opportunities = await OpportunityModel.find({
      deadline: {
        $gte: new Date(),
        $lt: tomorrow
      }
    }).populate('companyId');
  
    for (const opportunity of opportunities) {
      const notification = new NotificationModel({
        userId: opportunity.companyId._id,
        onModel: 'Company',
        type: 'Opportunity Deadline Reminder',
        message: `The deadline for your ${opportunity.field} opportunity is approaching. Do you want to extend it?`,
        isRead: false
      });
  
      await notification.save();
    }
  });    

  cron.schedule('0 12 * * *', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    const opportunities = await OpportunityModel.find({
      deadline: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('companyId');
  
    for (const opportunity of opportunities) {
      const notification = new NotificationModel({
        userId: opportunity.companyId._id,
        onModel: 'Company',
        type: 'Opportunity Deadline Reached',
        message: `The deadline for your ${opportunity.field} opportunity has been reached. It's time to review the applications.`,
        isRead: false
      });
  
      await notification.save();
    }
  });

  app.post('/opportunity/:opportunityId/scheduleInterview/:studentId', async (req, res) => {
    const { opportunityId, studentId } = req.params;
    const { interviewType, interviewDate, interviewTime, interviewLink, interviewAddress } = req.body;
  
    try {
      const opportunity = await OpportunityModel.findById(opportunityId).populate('companyId');
      if (!opportunity) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
  
      const applicantIndex = opportunity.applicants.findIndex(applicant => applicant.studentId.toString() === studentId);
      if (applicantIndex === -1) {
        return res.status(404).json({ success: false, message: 'Applicant not found' });
      }
  
      const applicant = opportunity.applicants[applicantIndex];
      applicant.interviewType = interviewType;
      applicant.interviewDate = interviewDate;
      applicant.interviewTime = interviewTime;
      applicant.status = 'waiting';
      if (interviewType === 'online') {
        applicant.interviewLink = interviewLink;
      } else if (interviewType === 'in-person') {
        applicant.interviewAddress = interviewAddress;
      }
  
      await opportunity.save();
  
      const notification = new NotificationModel({
        userId: studentId,
        onModel: 'Student',
        type: 'Interview Scheduled',
        message: `An interview has been scheduled for you for the ${opportunity.field} opportunity at ${opportunity.companyId.companyName}.`,
        isRead: false
      });
      await notification.save();
  
      res.json({ success: true, message: 'Interview scheduled successfully' });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/username/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const student = await StudentModel.findById(userId);
        if (student) {
            return res.json({ username: student.name });
        }
        const company = await CompanyModel.findById(userId);
        if (company) {
            return res.json({ username: company.companyName });
        }
        return res.status(404).json({ error: 'User not found' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});    
app.listen("3001", () => {
  console.log("server worked!");
});