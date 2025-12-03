import express from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 10;

function operatorRegistrationRoute(pool) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const {
        fullName,
        dob,
        gender,
        nationalId,
        mobileNumber,
        emailAddress,
        contactNumber,
        experienceLevel,
        password,
        baseLocation
      } = req.body;

      if (!fullName || !mobileNumber || !emailAddress || !password || !experienceLevel) {
        return res.status(400).json({
          error:
            "Missing required fields: fullName, mobileNumber, emailAddress, password, experienceLevel"
        });
      }

      const allowedLevels = ["Beginner", "Intermediate", "Expert"];
      if (!allowedLevels.includes(experienceLevel)) {
        return res.status(400).json({
          error: `experienceLevel must be one of: ${allowedLevels.join(", ")}`
        });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const operatorId = uuidv4();

      const query = `
        INSERT INTO operators (
          operator_id,
          full_name,
          dob,
          gender,
          national_id,
          mobile_number,
          email_address,
          contact_number,
          experience_level,
          password_hash,
          base_location
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING operator_id, full_name, email_address, mobile_number, experience_level, base_location, created_at;
      `;

      const values = [
        operatorId,
        fullName,
        dob || null,
        gender || null,
        nationalId || null,
        mobileNumber,
        emailAddress,
        contactNumber || null,
        experienceLevel,
        passwordHash,
        baseLocation || null
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        message: "Operator created successfully",
        operator: result.rows[0]
      });

    } catch (err) {
      console.error("Error:", err);

      if (err.code === "23505") {
        return res.status(409).json({
          error: "Email or Mobile number already exists"
        });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export default operatorRegistrationRoute;
