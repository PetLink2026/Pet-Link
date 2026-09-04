const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

// Initialize PostgreSQL pool
let pool;
try {
  const initModule = require('../../database/supabase/init');
  pool = initModule.pool;
} catch (e) {
  // Fallback pool
}
if (!pool) {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  pool = new Pool({ connectionString });
}

// Ensure all shelter-related database tables exist
let tablesChecked = false;
const ensureShelterTables = async () => {
  if (tablesChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shelter_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL UNIQUE,
        logo TEXT DEFAULT '',
        description TEXT DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        email VARCHAR(100) DEFAULT '',
        address TEXT DEFAULT '',
        country VARCHAR(100) DEFAULT 'Pakistan',
        province VARCHAR(100) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        area VARCHAR(100) DEFAULT '',
        "postalCode" VARCHAR(20) DEFAULT '',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        "shelterTypes" TEXT[] DEFAULT '{}',
        "acceptedSpecies" TEXT[] DEFAULT '{}',
        "acceptedBreeds" TEXT[] DEFAULT '{}',
        capacity INTEGER DEFAULT 0,
        "occupiedSpaces" INTEGER DEFAULT 0,
        facilities TEXT[] DEFAULT '{}',
        "providesPickup" BOOLEAN DEFAULT FALSE,
        "pickupServiceType" VARCHAR(50) DEFAULT 'None',
        "pickupRadius" DOUBLE PRECISION DEFAULT 0,
        "pickupFee" DOUBLE PRECISION DEFAULT 0,
        "pickupFeeType" VARCHAR(20) DEFAULT 'Free',
        "pickupFeePerKm" DOUBLE PRECISION DEFAULT 0,
        "pickupAreas" TEXT[] DEFAULT '{}',
        "dailyRate" DOUBLE PRECISION DEFAULT 0,
        "weeklyRate" DOUBLE PRECISION DEFAULT 0,
        "monthlyRate" DOUBLE PRECISION DEFAULT 0,
        "dayCareRate" DOUBLE PRECISION DEFAULT 0,
        "overnightRate" DOUBLE PRECISION DEFAULT 0,
        "dropOffFee" DOUBLE PRECISION DEFAULT 0,
        "openingTime" VARCHAR(20) DEFAULT '',
        "closingTime" VARCHAR(20) DEFAULT '',
        "daysOpen" TEXT[] DEFAULT '{}',
        "isAlwaysOpen" BOOLEAN DEFAULT FALSE,
        "checkInTime" VARCHAR(20) DEFAULT '',
        "checkOutTime" VARCHAR(20) DEFAULT '',
        "pickupHours" VARCHAR(100) DEFAULT '',
        "dropOffHours" VARCHAR(100) DEFAULT '',
        rules TEXT[] DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'Active',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shelter_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shelterId" UUID NOT NULL REFERENCES shelter_profiles(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        images TEXT[] DEFAULT '{}',
        "acceptedPetTypes" TEXT[] DEFAULT '{}',
        "maxCapacity" INTEGER DEFAULT 0,
        "dailyRate" DOUBLE PRECISION DEFAULT 0,
        facilities TEXT[] DEFAULT '{}',
        address TEXT DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        province VARCHAR(100) DEFAULT '',
        availability VARCHAR(50) DEFAULT 'Available',
        status VARCHAR(50) DEFAULT 'Active',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shelter_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shelterId" UUID NOT NULL REFERENCES shelter_profiles(id) ON DELETE CASCADE,
        "serviceId" UUID REFERENCES shelter_services(id) ON DELETE SET NULL,
        "petId" UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        "ownerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "checkInDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "checkOutDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        duration INTEGER NOT NULL,
        "pickupOption" VARCHAR(50) DEFAULT 'No Pickup',
        "pickupAddress" TEXT DEFAULT '',
        "pickupStatus" VARCHAR(50) DEFAULT 'Requested',
        "specialInstructions" TEXT DEFAULT '',
        "totalAmount" DOUBLE PRECISION DEFAULT 0,
        "pickupFee" DOUBLE PRECISION DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        "rejectionReason" TEXT DEFAULT '',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shelter_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingId" UUID NOT NULL REFERENCES shelter_bookings(id) ON DELETE CASCADE,
        "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "receiverId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shelter_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shelterId" UUID NOT NULL REFERENCES shelter_profiles(id) ON DELETE CASCADE,
        "bookingId" UUID NOT NULL UNIQUE REFERENCES shelter_bookings(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT DEFAULT '',
        response TEXT DEFAULT '',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shelter_wishlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "shelterId" UUID NOT NULL REFERENCES shelter_profiles(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("userId", "shelterId")
      );
    `);
    tablesChecked = true;
  } catch (err) {
    console.warn('ensureShelterTables warning:', err.message);
  }
};

// Helper to extract authenticated user ID from headers or token safely
const extractUserId = (req) => {
  let requesterId = req.headers['x-requester-id'] || req.headers['x-user-id'] || req.user?.id || req.user?._id;
  if (!requesterId && req.headers['authorization']) {
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'petlink_super_secret_key_2026');
        if (decoded && decoded.id) requesterId = decoded.id;
      }
    } catch (err) {
      // Ignored invalid token error
    }
  }
  return requesterId;
};

// Helper to check user role from DB
const checkRole = async (userId, allowedRoles = ['shelter_provider', 'admin']) => {
  if (!userId) return false;
  try {
    const res = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) return false;
    return allowedRoles.includes(res.rows[0].role);
  } catch (err) {
    console.error('checkRole error:', err.message);
    return false;
  }
};

// @desc    Check unique shelter name
// @route   GET /api/shelter/check-name
// @access  Public
exports.checkNameUniqueness = async (req, res) => {
  try {
    await ensureShelterTables();
    const { name } = req.query;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name parameter is required' });
    }

    const { rows } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    const available = rows.length === 0;
    return res.status(200).json({ 
      available, 
      message: available ? '✓ Shelter name available' : 'That shelter name is already in use.' 
    });
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    return res.status(500).json({ message: 'Error checking name uniqueness', error: error.message });
  }
};

// @desc    Get shelter profile of logged in user
// @route   GET /api/shelter/profile
// @access  Private
exports.getShelterProfile = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access: Missing user identification' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (rows.length === 0) {
      return res.status(200).json(null);
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error retrieving shelter profile:', error);
    return res.status(500).json({ message: 'Error retrieving shelter profile', error: error.message });
  }
};

// @desc    Create or update shelter profile
// @route   POST /api/shelter/profile
// @access  Private (Shelter Provider)
exports.upsertShelterProfile = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access: Missing user identification' });
    }

    const isAuthorized = await checkRole(requesterId);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden: Shelter Provider access only' });
    }

    const body = req.body || {};
    const shelterName = body.name ? body.name.trim() : '';
    if (!shelterName) {
      return res.status(400).json({ message: 'Shelter name is required' });
    }

    // Check collision with another user's shelter profile
    const collisionCheck = await pool.query(
      'SELECT id, "userId" FROM shelter_profiles WHERE LOWER(name) = LOWER($1)',
      [shelterName]
    );
    if (collisionCheck.rows.length > 0 && collisionCheck.rows[0].userId !== requesterId) {
      return res.status(409).json({ message: 'That shelter name is already in use.' });
    }

    const existingRes = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    const now = new Date().toISOString();
    let resultRow;
    let statusCode = 200;

    if (existingRes.rows.length > 0) {
      // Update existing profile
      const updateRes = await pool.query(
        `UPDATE shelter_profiles SET
          name = $1,
          logo = $2,
          description = $3,
          phone = $4,
          email = $5,
          address = $6,
          country = $7,
          province = $8,
          city = $9,
          area = $10,
          "postalCode" = $11,
          latitude = $12,
          longitude = $13,
          "shelterTypes" = $14,
          "acceptedSpecies" = $15,
          "acceptedBreeds" = $16,
          capacity = $17,
          facilities = $18,
          "providesPickup" = $19,
          "pickupServiceType" = $20,
          "pickupRadius" = $21,
          "pickupFee" = $22,
          "pickupFeeType" = $23,
          "pickupFeePerKm" = $24,
          "dailyRate" = $25,
          "weeklyRate" = $26,
          "monthlyRate" = $27,
          "dayCareRate" = $28,
          "overnightRate" = $29,
          "openingTime" = $30,
          "closingTime" = $31,
          "daysOpen" = $32,
          rules = $33,
          "updatedAt" = $34
        WHERE "userId" = $35
        RETURNING *`,
        [
          shelterName,
          body.logo || '',
          body.description || '',
          body.phone || '',
          body.email || '',
          body.address || '',
          body.country || 'Pakistan',
          body.province || '',
          body.city || '',
          body.area || '',
          body.postalCode || '',
          body.latitude || null,
          body.longitude || null,
          body.shelterTypes || [],
          body.acceptedSpecies || [],
          body.acceptedBreeds || [],
          body.capacity || 10,
          body.facilities || [],
          Boolean(body.providesPickup),
          body.pickupServiceType || 'None',
          body.pickupRadius || 0,
          body.pickupFee || 0,
          body.pickupFeeType || 'Free',
          body.pickupFeePerKm || 0,
          body.dailyRate || 0,
          body.weeklyRate || 0,
          body.monthlyRate || 0,
          body.dayCareRate || 0,
          body.overnightRate || 0,
          body.openingTime || '',
          body.closingTime || '',
          body.daysOpen || [],
          body.rules || [],
          now,
          requesterId
        ]
      );
      resultRow = updateRes.rows[0];
      statusCode = 200;
    } else {
      // Create new profile
      statusCode = 201;
      const insertRes = await pool.query(
        `INSERT INTO shelter_profiles (
          "userId", name, logo, description, phone, email, address, country, province, city, area,
          "postalCode", latitude, longitude, "shelterTypes", "acceptedSpecies", "acceptedBreeds",
          capacity, facilities, "providesPickup", "pickupServiceType", "pickupRadius", "pickupFee",
          "pickupFeeType", "pickupFeePerKm", "dailyRate", "weeklyRate", "monthlyRate", "dayCareRate",
          "overnightRate", "openingTime", "closingTime", "daysOpen", rules, status, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
        ) RETURNING *`,
        [
          requesterId,
          shelterName,
          body.logo || '',
          body.description || '',
          body.phone || '',
          body.email || '',
          body.address || '',
          body.country || 'Pakistan',
          body.province || '',
          body.city || '',
          body.area || '',
          body.postalCode || '',
          body.latitude || null,
          body.longitude || null,
          body.shelterTypes || [],
          body.acceptedSpecies || [],
          body.acceptedBreeds || [],
          body.capacity || 10,
          body.facilities || [],
          Boolean(body.providesPickup),
          body.pickupServiceType || 'None',
          body.pickupRadius || 0,
          body.pickupFee || 0,
          body.pickupFeeType || 'Free',
          body.pickupFeePerKm || 0,
          body.dailyRate || 0,
          body.weeklyRate || 0,
          body.monthlyRate || 0,
          body.dayCareRate || 0,
          body.overnightRate || 0,
          body.openingTime || '',
          body.closingTime || '',
          body.daysOpen || [],
          body.rules || [],
          body.status || 'Active',
          now,
          now
        ]
      );
      resultRow = insertRes.rows[0];
    }

    return res.status(statusCode).json(resultRow);
  } catch (error) {
    console.error('Error saving shelter profile:', error);
    return res.status(500).json({ message: 'Error saving shelter profile', error: error.message });
  }
};

// @desc    Get provider shelter services
// @route   GET /api/shelter/services
// @access  Private (Shelter Provider)
exports.getShelterServices = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'No shelter profile found for user' });
    }

    const { rows: services } = await pool.query(
      'SELECT * FROM shelter_services WHERE "shelterId" = $1 ORDER BY "createdAt" DESC',
      [profiles[0].id]
    );

    return res.status(200).json(services);
  } catch (error) {
    console.error('Error retrieving shelter services:', error);
    return res.status(500).json({ message: 'Error retrieving shelter services', error: error.message });
  }
};

// @desc    Create shelter service
// @route   POST /api/shelter/services
// @access  Private (Shelter Provider)
exports.createShelterService = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(400).json({ message: 'Create a shelter profile first' });
    }

    const body = req.body || {};
    const now = new Date().toISOString();

    const { rows } = await pool.query(
      `INSERT INTO shelter_services (
        "shelterId", name, description, images, "acceptedPetTypes", "maxCapacity",
        "dailyRate", facilities, address, city, province, availability, status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        profiles[0].id,
        body.name || 'Standard Service',
        body.description || '',
        body.images || [],
        body.acceptedPetTypes || [],
        body.maxCapacity || 0,
        body.dailyRate || 0,
        body.facilities || [],
        body.address || '',
        body.city || '',
        body.province || '',
        body.availability || 'Available',
        body.status || 'Active',
        now,
        now
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating shelter service:', error);
    return res.status(500).json({ message: 'Error creating shelter service', error: error.message });
  }
};

// @desc    Update shelter service
// @route   PUT /api/shelter/services/:id
// @access  Private (Shelter Provider)
exports.updateShelterService = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Shelter profile not found' });
    }

    const { id } = req.params;
    const body = req.body || {};
    const now = new Date().toISOString();

    const { rows } = await pool.query(
      `UPDATE shelter_services SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        "dailyRate" = COALESCE($3, "dailyRate"),
        "maxCapacity" = COALESCE($4, "maxCapacity"),
        availability = COALESCE($5, availability),
        "updatedAt" = $6
      WHERE id = $7 AND "shelterId" = $8
      RETURNING *`,
      [
        body.name,
        body.description,
        body.dailyRate,
        body.maxCapacity,
        body.availability,
        now,
        id,
        profiles[0].id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error updating shelter service:', error);
    return res.status(500).json({ message: 'Error updating shelter service', error: error.message });
  }
};

// @desc    Delete/Deactivate shelter service
// @route   DELETE /api/shelter/services/:id
// @access  Private (Shelter Provider)
exports.deleteShelterService = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Shelter profile not found' });
    }

    const { id } = req.params;
    const now = new Date().toISOString();

    const { rows } = await pool.query(
      `UPDATE shelter_services SET status = 'Inactive', "updatedAt" = $1
       WHERE id = $2 AND "shelterId" = $3 RETURNING *`,
      [now, id, profiles[0].id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error deactivating shelter service:', error);
    return res.status(500).json({ message: 'Error deactivating shelter service', error: error.message });
  }
};

// @desc    Get shelter bookings
// @route   GET /api/shelter/bookings
// @access  Private (Shelter Provider)
exports.getShelterBookings = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Shelter profile not found' });
    }

    const { rows: bookings } = await pool.query(
      `SELECT b.*,
              u.name AS "ownerName", u.email AS "ownerEmail", u.phone AS "ownerPhone",
              p.name AS "petName", p.breed AS "petBreed", p.species AS "petSpecies", p.image AS "petImage",
              s.name AS "serviceName"
       FROM shelter_bookings b
       LEFT JOIN users u ON b."ownerId" = u.id
       LEFT JOIN pets p ON b."petId" = p.id
       LEFT JOIN shelter_services s ON b."serviceId" = s.id
       WHERE b."shelterId" = $1
       ORDER BY b."createdAt" DESC`,
      [profiles[0].id]
    );

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    return res.status(500).json({ message: 'Error retrieving bookings', error: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/shelter/bookings/:id/status
// @access  Private (Shelter Provider)
exports.updateBookingStatus = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Shelter profile not found' });
    }

    const { id } = req.params;
    const { status, rejectionReason } = req.body || {};
    const now = new Date().toISOString();

    const { rows: updated } = await pool.query(
      `UPDATE shelter_bookings SET
        status = $1,
        "rejectionReason" = $2,
        "updatedAt" = $3
       WHERE id = $4 AND "shelterId" = $5
       RETURNING *`,
      [
        status || 'Pending',
        status === 'Rejected' ? rejectionReason || '' : '',
        now,
        id,
        profiles[0].id
      ]
    );

    if (updated.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Calculate occupied spaces
    const activeRes = await pool.query(
      `SELECT count(*) FROM shelter_bookings WHERE "shelterId" = $1 AND status IN ('Accepted', 'Active')`,
      [profiles[0].id]
    );
    const occupiedCount = parseInt(activeRes.rows[0].count) || 0;

    await pool.query(
      'UPDATE shelter_profiles SET "occupiedSpaces" = $1 WHERE id = $2',
      [occupiedCount, profiles[0].id]
    );

    return res.status(200).json(updated[0]);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
};

// @desc    Get public shelters for user discovery
// @route   GET /api/shelter/public/list
// @access  Public
exports.getPublicShelters = async (req, res) => {
  try {
    await ensureShelterTables();
    const { city, pickup } = req.query;

    let queryText = 'SELECT * FROM shelter_profiles WHERE status IN (\'Active\', \'Published\')';
    const params = [];

    if (city) {
      params.push(`%${city}%`);
      queryText += ` AND city ILIKE $${params.length}`;
    }

    if (pickup === 'true') {
      queryText += ` AND "providesPickup" = TRUE`;
    }

    queryText += ' ORDER BY "createdAt" DESC';

    const { rows } = await pool.query(queryText, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error discovering shelters:', error);
    return res.status(500).json({ message: 'Error discovering shelters', error: error.message });
  }
};

// @desc    Get public shelter details by ID
// @route   GET /api/shelter/public/:id
// @access  Public
exports.getPublicShelterDetails = async (req, res) => {
  try {
    await ensureShelterTables();
    const { id } = req.params;

    const { rows: shelters } = await pool.query(
      'SELECT * FROM shelter_profiles WHERE id = $1',
      [id]
    );

    if (shelters.length === 0) {
      return res.status(404).json({ message: 'Shelter not found' });
    }

    const { rows: services } = await pool.query(
      'SELECT * FROM shelter_services WHERE "shelterId" = $1 AND status = \'Active\'',
      [id]
    );

    const { rows: reviews } = await pool.query(
      `SELECT r.*, u.name AS "userName", u."profilePic" AS "userProfilePic"
       FROM shelter_reviews r
       LEFT JOIN users u ON r."userId" = u.id
       WHERE r."shelterId" = $1 ORDER BY r."createdAt" DESC`,
      [id]
    );

    return res.status(200).json({
      ...shelters[0],
      services: services || [],
      reviews: reviews || []
    });
  } catch (error) {
    console.error('Error retrieving shelter details:', error);
    return res.status(500).json({ message: 'Error retrieving shelter details', error: error.message });
  }
};

// @desc    Create booking request (by pet owner)
// @route   POST /api/shelter/public/bookings
// @access  Private
exports.createBookingRequest = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const body = req.body || {};
    const checkIn = new Date(body.checkInDate);
    const checkOut = new Date(body.checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const now = new Date().toISOString();
    const { rows } = await pool.query(
      `INSERT INTO shelter_bookings (
        "shelterId", "serviceId", "petId", "ownerId", "checkInDate", "checkOutDate",
        duration, "pickupOption", "pickupAddress", "specialInstructions", "totalAmount",
        "pickupFee", status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        body.shelterId,
        body.serviceId || null,
        body.petId,
        requesterId,
        checkIn.toISOString(),
        checkOut.toISOString(),
        body.duration || 1,
        body.pickupOption || 'No Pickup',
        body.pickupAddress || '',
        body.specialInstructions || '',
        body.totalAmount || 0,
        body.pickupFee || 0,
        'Pending',
        now,
        now
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error submitting booking request:', error);
    return res.status(500).json({ message: 'Error submitting booking request', error: error.message });
  }
};

// @desc    Get user's personal bookings
// @route   GET /api/shelter/user/bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows } = await pool.query(
      `SELECT b.*,
              s.name AS "shelterName", s.logo AS "shelterLogo", s.address AS "shelterAddress", s.phone AS "shelterPhone",
              p.name AS "petName", p.species AS "petSpecies", p.breed AS "petBreed", p.image AS "petImage",
              serv.name AS "serviceName"
       FROM shelter_bookings b
       LEFT JOIN shelter_profiles s ON b."shelterId" = s.id
       LEFT JOIN pets p ON b."petId" = p.id
       LEFT JOIN shelter_services serv ON b."serviceId" = serv.id
       WHERE b."ownerId" = $1
       ORDER BY b."createdAt" DESC`,
      [requesterId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error retrieving user bookings:', error);
    return res.status(500).json({ message: 'Error retrieving user bookings', error: error.message });
  }
};

// @desc    Get reviews for a shelter
// @route   GET /api/shelter/reviews
// @access  Public
exports.getShelterReviews = async (req, res) => {
  try {
    await ensureShelterTables();
    const { shelterId } = req.query;
    if (!shelterId) {
      return res.status(400).json({ message: 'Missing shelterId query parameter' });
    }

    const { rows } = await pool.query(
      `SELECT r.*, u.name AS "userName", u."profilePic" AS "userProfilePic"
       FROM shelter_reviews r
       LEFT JOIN users u ON r."userId" = u.id
       WHERE r."shelterId" = $1
       ORDER BY r."createdAt" DESC`,
      [shelterId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error retrieving shelter reviews:', error);
    return res.status(500).json({ message: 'Error retrieving shelter reviews', error: error.message });
  }
};

// @desc    Create a review for booking
// @route   POST /api/shelter/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { bookingId, rating, comment } = req.body || {};
    if (!bookingId || !rating) {
      return res.status(400).json({ message: 'BookingId and rating are required' });
    }

    const { rows: bookings } = await pool.query(
      'SELECT id, "shelterId" FROM shelter_bookings WHERE id = $1 AND "ownerId" = $2',
      [bookingId, requesterId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not owned by requester' });
    }

    const now = new Date().toISOString();
    const { rows } = await pool.query(
      `INSERT INTO shelter_reviews ("shelterId", "bookingId", "userId", rating, comment, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [bookings[0].shelterId, bookingId, requesterId, parseInt(rating), comment || '', now, now]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

// @desc    Respond to review
// @route   POST /api/shelter/reviews/:id/response
// @access  Private (Shelter Provider)
exports.respondToReview = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { id } = req.params;
    const { response } = req.body || {};

    const { rows: profiles } = await pool.query(
      'SELECT id FROM shelter_profiles WHERE "userId" = $1',
      [requesterId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Shelter profile not found' });
    }

    const now = new Date().toISOString();
    const { rows } = await pool.query(
      `UPDATE shelter_reviews SET response = $1, "updatedAt" = $2
       WHERE id = $3 AND "shelterId" = $4
       RETURNING *`,
      [response || '', now, id, profiles[0].id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error responding to review:', error);
    return res.status(500).json({ message: 'Error responding to review', error: error.message });
  }
};

// @desc    Get shelter messages
// @route   GET /api/shelter/messages/:bookingId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    await ensureShelterTables();
    const { bookingId } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM shelter_messages WHERE "bookingId" = $1 ORDER BY "createdAt" ASC',
      [bookingId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
};

// @desc    Send message
// @route   POST /api/shelter/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { bookingId, receiverId, message } = req.body || {};
    if (!bookingId || !receiverId || !message) {
      return res.status(400).json({ message: 'bookingId, receiverId, and message are required' });
    }

    const now = new Date().toISOString();
    const { rows } = await pool.query(
      `INSERT INTO shelter_messages ("bookingId", "senderId", "receiverId", message, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, FALSE, $5)
       RETURNING *`,
      [bookingId, requesterId, receiverId, message, now]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// @desc    Shelter Wishlist toggle
// @route   POST /api/shelter/wishlist
// @access  Private
exports.toggleWishlist = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { shelterId } = req.body || {};
    if (!shelterId) {
      return res.status(400).json({ message: 'shelterId is required' });
    }

    const { rows: existing } = await pool.query(
      'SELECT id FROM shelter_wishlist WHERE "userId" = $1 AND "shelterId" = $2',
      [requesterId, shelterId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM shelter_wishlist WHERE id = $1', [existing[0].id]);
      return res.status(200).json({ wishlisted: false });
    } else {
      await pool.query(
        'INSERT INTO shelter_wishlist ("userId", "shelterId") VALUES ($1, $2)',
        [requesterId, shelterId]
      );
      return res.status(200).json({ wishlisted: true });
    }
  } catch (error) {
    console.error('Wishlist toggle failed:', error);
    return res.status(500).json({ message: 'Wishlist toggle failed', error: error.message });
  }
};

// @desc    Get user's wishlist
// @route   GET /api/shelter/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    await ensureShelterTables();
    const requesterId = extractUserId(req);
    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { rows } = await pool.query(
      `SELECT s.* FROM shelter_wishlist w
       JOIN shelter_profiles s ON w."shelterId" = s.id
       WHERE w."userId" = $1`,
      [requesterId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error retrieving wishlist:', error);
    return res.status(500).json({ message: 'Error retrieving wishlist', error: error.message });
  }
};
