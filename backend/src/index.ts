import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// Salli CORS (voit lisätä cloudfront-osoitteen myöhemmin)
app.use(cors());
app.use(express.json());

// Testireitti, jotta näet selaimella että backend vastaa
app.get('/', (req: Request, res: Response) => {
  res.send('Flowstate Backend is running! 🚀');
});

// Health check -reitti AWS:lle
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
