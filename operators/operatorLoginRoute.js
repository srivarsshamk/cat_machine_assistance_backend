import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * operatorLoginRoute(pool)
 * POST body: { emailAddress, password }
 * Returns 200 { message, token, operator } on success
 */
function operatorLoginRoute(pool) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const { emailAddress, password } = req.body;

      if (!emailAddress || !password) {
        return res.status(400).json({ error: "Missing emailAddress or password" });
      }

      const query = `
        SELECT
          operator_id,
          full_name,
          email_address,
          mobile_number,
          experience_level,
          base_location,
          password_hash
        FROM operators
        WHERE email_address = $1
        LIMIT 1;
      `;

      const { rows } = await pool.query(query, [emailAddress.toLowerCase()]);
      const operator = rows[0];

      if (!operator) {
        // don't reveal whether email exists — generic message
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password, operator.password_hash || "");
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // remove password_hash before returning
      const { password_hash, ...operatorSafe } = operator;

      // sign a JWT if JWT_SECRET available
      let token = null;
      if (process.env.JWT_SECRET) {
        token = jwt.sign(
          {
            sub: operatorSafe.operator_id,
            role: "operator",
            email: operatorSafe.email_address
          },
          process.env.JWT_SECRET,
          { expiresIn: "8h" }
        );
      }

      return res.status(200).json({
        message: "Login successful",
        token,
        operator: operatorSafe
      });
    } catch (err) {
      console.error("Operator login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export default operatorLoginRoute;
