import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // ከሄደሩ ላይ "Bearer " የሚለውን ጽሑፍ አስወግዶ ቶከኑን ብቻ መውሰድ
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    if (!token) {
        return res.status(401).json({ error: 'መግቢያ Token አልተገኘም፣ እባክዎ ይግቡ' });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'የToken ትክክለኛነት ጊዜ አልፏል ወይም የተሳሳተ ነው' });
        }
        req.user = user;
        next();
    });
};
