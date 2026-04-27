import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || '';

// Database connection (Kommentoitu pois testauksen ajaksi)
/*
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ Connection error:', err));
}
*/
//seuraavat on AWS testailua varten
app.use(cors());
app.use(express.json());

// Luodaan router
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Backend rullaa siististi CloudFrontin läpi! 🚀');
});

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Kaikki routerin reitit vastaavat polkuun /api/...
app.use('/api', router);

// Tämä on "pohja-URL" (esim. suoraan Beanstalk-osoitteeseen mentäessä)
app.get('/', (req, res) => {
  res.send('Tämä on backendin juuri. API löytyy polusta /api');
});

app.listen(PORT, () => console.log(`✅ Server portissa ${PORT}`));
