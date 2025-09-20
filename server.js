import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const app = express();
const PORT = process.env.PORT ;

app.use(cors());
app.use(express.json());

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');
    
  } catch (error) {
    console.error( error);
    process.exit(1);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.post('/addSchool', async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: ' required: name, address, latitude, longitude'
      });
    }

    if (typeof name !== 'string' || typeof address !== 'string') {
      return res.status(400).json({
        error: 'Name and address must be strings'
      });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        error: 'Latitude and longitude must be numbers'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Longitude must be between -180 and 180'
      });
    }

    const result = await client.query(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, address, latitude, longitude]
    );

    res.status(201).json({
      message: 'School added ',
      schoolId: result.rows[0].id
    });

  } catch (error) {
    console.error( error);
    res.status(500).json({
      error: 'Failed to add school'
    });
  }
});

app.get('/listSchools', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude and longitude parameters are required'
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        error: 'Latitude and longitude must be valid numbers'
      });
    }

    if (userLat < -90 || userLat > 90) {
      return res.status(400).json({
        error: 'Latitude must be between -90 and 90'
      });
    }

    if (userLon < -180 || userLon > 180) {
      return res.status(400).json({
        error: 'Longitude must be between -180 and 180'
      });
    }

    const result = await client.query('SELECT * FROM schools');
    const schools = result.rows;


    const schoolsWithDistance = schools.map(school => ({
      ...school,
      distance: calculateDistance(userLat, userLon, school.latitude, school.longitude)
    }));

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      schools: schoolsWithDistance
    });

  } catch (error) {
    console.error( error);
    res.status(500).json({
      error: 'Failed to fetch schools'
    });
  }
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
}

startServer();

