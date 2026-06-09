import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import { authenticateToken } from './auth.js';
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
// ==================== USER AUTHENTICATION API ====================
// 1. የተጠቃሚ መመዝገቢያ (Register)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'እባክዎ ሁሉንም ክፍሎች ይሙሉ' });
        }
        // የይለፍ ቃል መመስጠር
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        res.status(201).json({ message: 'ተጠቃሚው በተሳካ ሁኔታ ተመዝግቧል' });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'ይህ ኢሜይል ወይም የተጠቃሚ ስም አስቀድሞ ተመዝግቧል' });
        }
        res.status(500).json({ error: error.message });
    }
});
// 2. የተጠቃሚ መግቢያ (Login)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0)
            return res.status(400).json({ error: 'ኢሜይል ወይም ይለፍ ቃል የተሳሳተ ነው' });
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(400).json({ error: 'ኢሜይል ወይም ይለፍ ቃል የተሳሳተ ነው' });
        // JWT Token መፍጠር
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ==================== TASKS API (PROTECTED BY JWT) ====================
// 1. የገባው ተጠቃሚ የራሱን ስራዎች ብቻ ማምጫ
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 2. ከተጠቃሚው ID ጋር አዲስ ስራ መፍጠሪያ
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)', [title, description, req.user?.id]);
        res.json({ id: result.insertId, title, description, status: 'pending' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. የስራ ሁኔታ ማሻሻያ
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?', [status, id, req.user?.id]);
        res.json({ message: 'Task updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 4. ስራ ማጥፊያ
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user?.id]);
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 👥 በዳታቤዙ ያሉትን ሁሉንም ተጠቃሚዎች በተርሚናል ላይ ማሳያ (ለንባብ ብቻ)
app.get('/api/debug/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, email, created_at FROM users');
        console.log("=================== 👥 REGISTERED USERS ===================");
        console.table(users);
        console.log("==========================================================");
        res.json({ message: "ተጠቃሚዎች በባክኤንድ ተርሚናል ላይ ታትመዋል", total: users.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
