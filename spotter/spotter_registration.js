import express from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 10;

function spotterRegistrationRoute(pool) {
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
        workShift,
        assignedOperatorId,
        password,
        baseLocation
      } = req.body;

      // Required fields validation
      if (!fullName || !mobileNumber || !emailAddress || !password) {
        return res.status(400).json({
          error:
            "Missing required fields: fullName, mobileNumber, emailAddress, password"
        });
      }

      // Optional: Validate shift choices
      const allowedShifts = ["Morning", "Evening", "Night"];
      if (workShift && !allowedShifts.includes(workShift)) {
        return res.status(400).json({
          error: `workShift must be one of: ${allowedShifts.join(", ")}`
        });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const spotterId = uuidv4();

      const query = `
        INSERT INTO spotters (
          spotter_id,
          full_name,
          dob,
          gender,
          national_id,
          mobile_number,
          email_address,
          contact_number,
          work_shift,
          assigned_operator_id,
          password_hash,
          base_location
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING spotter_id, full_name, email_address, mobile_number, work_shift, base_location, created_at;
      `;

      const values = [
        spotterId,
        fullName,
        dob || null,
        gender || null,
        nationalId || null,
        mobileNumber,
        emailAddress,
        contactNumber || null,
        workShift || null,
        assignedOperatorId || null,
        passwordHash,
        baseLocation || null
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        message: "Spotter created successfully",
        spotter: result.rows[0]
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

export default spotterRegistrationRoute;
