const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Admin
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ msg: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    admin = new Admin({ email, password: hashedPassword });
    await admin.save();
    res.status(201).json({ msg: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login Admin
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
