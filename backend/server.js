import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import jwt from 'jsonwebtoken';

const {
  MANAGER_USER, MANAGER_PASS,
  COMANAGER_USER, COMANAGER_PASS,
  JWT_SECRET,
} = process.env;

const app = express();
app.use(cors());
app.use(express.json());

// Login endpoint for manager and comanager

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const ok =
    (username === MANAGER_USER && password === MANAGER_PASS) ||
    (username === COMANAGER_USER  && password === COMANAGER_PASS);

  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // issue a JWT
  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token });
});

// authorization middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// apply auth to all crew & schedule routes:
app.use('/api/crew',     authMiddleware);
app.use('/api/schedule', authMiddleware);

// Health check
app.get('/', (req, res) => res.send('API is up 🚀'));

// --- Crew CRUD using PostgreSQL ---

// LIST
app.get('/api/crew', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain      AS "positionsTrainedCaptain",
        positions_trained_1st_mate     AS "positionsTrained1stMate",
        positions_trained_engineer     AS "positionsTrainedEngineer",
        positions_trained_chef         AS "positionsTrainedChef",
        positions_trained_deckhand     AS "positionsTrainedDeckhand",
        boats_trained_catppalu         AS "boatsTrainedCatPpalu",
        boats_trained_morningstar      AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer      AS "boatsTrainedSeaExplorer",
        preferred_name  AS "preferredName",
        bank_name AS "bankName",
        institute_number AS "instituteNumber",
        transit_number AS "transitNumber",
        account_number AS "accountNumber",
        (current_cycle_start + cycle_length_weeks * INTERVAL '1 week')::DATE
          AS "currentCycleEnd"
      FROM crew
      ORDER BY id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET by ID
app.get('/api/crew/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain      AS "positionsTrainedCaptain",
        positions_trained_1st_mate     AS "positionsTrained1stMate",
        positions_trained_engineer     AS "positionsTrainedEngineer",
        positions_trained_chef         AS "positionsTrainedChef",
        positions_trained_deckhand     AS "positionsTrainedDeckhand",
        boats_trained_catppalu         AS "boatsTrainedCatPpalu",
        boats_trained_morningstar      AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer      AS "boatsTrainedSeaExplorer",
        preferred_name AS "preferredName",
        bank_name AS "bankName",
        institute_number AS "instituteNumber",
        transit_number AS "transitNumber",
        account_number AS "accountNumber",
        (current_cycle_start + cycle_length_weeks * INTERVAL '1 week')::DATE
          AS "currentCycleEnd"
      FROM crew
      WHERE id = $1;
    `, [req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE
app.post('/api/crew', async (req, res) => {

  try {
    const {
      firstName, lastName, email, telephone,
      contactMethod, dateEmploymentStarted,
      currentCycleStart, cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber
    } = req.body;

    const result = await pool.query(`
      INSERT INTO crew (
        first_name, last_name, email, telephone,
        contact_method, date_employment_started,
        current_cycle_start, cycle_length_weeks,
        positions_trained_captain,
        positions_trained_1st_mate,
        positions_trained_engineer,
        positions_trained_chef,
        positions_trained_deckhand,
        boats_trained_catppalu,
        boats_trained_morningstar,
        boats_trained_seaexplorer,
        preferred_name,
        bank_name,
        institute_number,
        transit_number,
        account_number
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain  AS "positionsTrainedCaptain",
        positions_trained_1st_mate AS "positionsTrained1stMate",
        positions_trained_engineer AS "positionsTrainedEngineer",
        positions_trained_chef     AS "positionsTrainedChef",
        positions_trained_deckhand AS "positionsTrainedDeckhand",
        boats_trained_catppalu     AS "boatsTrainedCatPpalu",
        boats_trained_morningstar  AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer  AS "boatsTrainedSeaExplorer",
        preferred_name                 AS "preferredName",
        bank_name                      AS "bankName",
        institute_number               AS "instituteNumber",
        transit_number                 AS "transitNumber",
        account_number                 AS "accountNumber",
        (current_cycle_start + cycle_length_weeks * INTERVAL '1 week')::DATE
          AS "currentCycleEnd"
    `, [
      firstName,
      lastName,
      email,
      telephone,
      contactMethod,
      dateEmploymentStarted,
      currentCycleStart,
      cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/crew/:id', async (req, res) => {
  try {
    const {
      firstName, lastName, email, telephone,
      contactMethod, dateEmploymentStarted,
      currentCycleStart, cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber
    } = req.body;

    const result = await pool.query(`
      UPDATE crew SET
        first_name                 = $1,
        last_name                  = $2,
        email                      = $3,
        telephone                  = $4,
        contact_method             = $5,
        date_employment_started    = $6,
        current_cycle_start        = $7,
        cycle_length_weeks         = $8,
        positions_trained_captain  = $9,
        positions_trained_1st_mate = $10,
        positions_trained_engineer = $11,
        positions_trained_chef     = $12,
        positions_trained_deckhand = $13,
        boats_trained_catppalu     = $14,
        boats_trained_morningstar  = $15,
        boats_trained_seaexplorer  = $16,
        preferred_name             = $17,
        bank_name                  = $18,
        institute_number           = $19,
        transit_number             = $20,
        account_number             = $21
        WHERE id = $22
        RETURNING
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain  AS "positionsTrainedCaptain",
        positions_trained_1st_mate AS "positionsTrained1stMate",
        positions_trained_engineer AS "positionsTrainedEngineer",
        positions_trained_chef     AS "positionsTrainedChef",
        positions_trained_deckhand AS "positionsTrainedDeckhand",
        boats_trained_catppalu     AS "boatsTrainedCatPpalu",
        boats_trained_morningstar  AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer  AS "boatsTrainedSeaExplorer",
        preferred_name                 AS "preferredName",
        bank_name                      AS "bankName",
        institute_number               AS "instituteNumber",
        transit_number                 AS "transitNumber",
        account_number                 AS "accountNumber"
    `, [
      firstName,
      lastName,
      email,
      telephone,
      contactMethod,
      dateEmploymentStarted,
      currentCycleStart,
      cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber,
      req.params.id
    ]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ message: 'Updated', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE
// app.delete('/api/crew/:id', async (req, res) => {
//   try {
//     const result = await pool.query(
//       'DELETE FROM crew WHERE id = $1 RETURNING id;',
//       [req.params.id]
//     );
//     if (!result.rows.length) {
//       return res.status(404).json({ error: 'Not found' });
//     }
//     res.json({ message: 'Deleted', id: result.rows[0].id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });
app.delete('/api/crew/:id', async (req, res) => {
  const { id } = req.params;
  console.log('🔍 DELETE /api/crew/:id called with id=', id);
  try {
    const result = await pool.query(
      'DELETE FROM crew WHERE id = $1 RETURNING id;',
      [id]
    );
    console.log('🔍 delete result:', result.rows);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ message: 'Deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('🔥 delete error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Schedule stubs (unchanged)
app.get('/api/schedule', async (req, res) => {
  try {
    const weekStart = req.query.date;               // "YYYY-MM-DD"
    const weekEnd   = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // fetch entries + crew data
    const result = await pool.query(`
      SELECT
        e.boat_id,
        e.position,
        e.crew_id,
        c.first_name, c.last_name,
        c.current_cycle_start,
        c.cycle_length_weeks
      FROM schedule_entries e
      JOIN crew c ON c.id = e.crew_id
      WHERE e.week_start = $1;
    `, [weekStart]);

    // build slots[boat][position] = { crewId, name, week, cycleLength }
    const slots = {};
    result.rows.forEach(r => {
      slots[r.boat_id] = slots[r.boat_id] || {};
      // compute personal week number: difference in weeks +1
      const start = new Date(r.current_cycle_start);
      const wkNum = Math.floor((new Date(weekStart) - start) / (7*24*60*60*1000)) + 1;
      slots[r.boat_id][r.position] = {
        crewId: r.crew_id,
        name:   `${r.first_name} ${r.last_name}`,
        week:   wkNum,
        cycleLength: r.cycle_length_weeks
      };
    });

    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST schedule for one week (replace all entries for that week)
app.post('/api/schedule', async (req, res) => {
  console.log('POST /api/schedule body:', req.body);
  try {
    const { date: weekStart, slots } = req.body;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // delete existing for that week
    await pool.query(
      `DELETE FROM schedule_entries WHERE week_start = $1;`,
      [weekStart]
    );

    // insert new ones, including crew_name
    const queries = [];
    for (const [boatId, positions] of Object.entries(slots)) {
      for (const [position, slot] of Object.entries(positions)) {
        const { crewId, week, cycleLength, name } = slot;
        if (!crewId) continue; // skip empty slots

        queries.push(
          pool.query(
            `
            INSERT INTO schedule_entries
              (week_start, week_end, week_number, boat_id, position, crew_id, crew_name)
            VALUES ($1,      $2,      $3,          $4,      $5,       $6,      $7)
            `,
            [
              weekStart,
              weekEnd,
              week,
              boatId,
              position,
              crewId,
              name         // ← now inserting the denormalized crew name
            ]
          )
        );
      }
    }

    await Promise.all(queries);
    res.json({ message: 'Saved' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
