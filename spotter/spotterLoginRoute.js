import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * spotterLoginRoute(pool)
 * POST body: { emailAddress, password }
 * Returns 200 { message, token, spotter } on success
 */
function spotterLoginRoute(pool) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const { emailAddress, password } = req.body;

      if (!emailAddress || !password) {
        return res.status(400).json({ error: "Missing emailAddress or password" });
      }

      const query = `
        SELECT
          spotter_id,
          full_name,
          email_address,
          mobile_number,
          work_shift,
          assigned_operator_id,
          base_location,
          password_hash
        FROM spotters
        WHERE email_address = $1
        LIMIT 1;
      `;

      const { rows } = await pool.query(query, [emailAddress.toLowerCase()]);
      const spotter = rows[0];

      if (!spotter) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password, spotter.password_hash || "");
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // remove password_hash before returning
      const { password_hash, ...spotterSafe } = spotter;

      // sign a JWT if JWT_SECRET available
      let token = null;
      if (process.env.JWT_SECRET) {
        token = jwt.sign(
          {
            sub: spotterSafe.spotter_id,
            role: "spotter",
            email: spotterSafe.email_address
          },
          process.env.JWT_SECRET,
          { expiresIn: "8h" }
        );
      }

      return res.status(200).json({
        message: "Login successful",
        token,
        spotter: spotterSafe
      });
    } catch (err) {
      console.error("Spotter login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export default spotterLoginRoute;
