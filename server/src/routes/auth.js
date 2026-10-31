// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();
// >=8 chars, 1 uppercase, 1 lowercase, 1 special character
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  if (!PASSWORD_REGEX.test(password))
    return res.status(400).json({ error: 'Password must be 8+ chars with an uppercase, a lowercase and a special character' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });
  // Public signup is ALWAYS Customer. Admin/Staff are seeded or promoted by an admin.
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'Customer' });
  res.status(201).json({ token: sign(user), user: { id: user._id, name, email, role: user.role } });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
export default router;
