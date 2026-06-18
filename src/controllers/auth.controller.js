import User from "../models/User.model.js";
import Customer from "../models/Customer.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function getRoleByEmail(email) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const userEmail = normalizeEmail(email);

  if (adminEmail && userEmail === adminEmail) {
    return "admin";
  }

  return "customer";
}

async function saveCustomerFromUser(user) {
  const role = String(user.role || "customer").toLowerCase();

  // المدير ما بدنا يظهر بصفحة الزبائن
  if (role === "admin") return;

  const email = normalizeEmail(user.email);

  if (!email) return;

  const customerName =
    user.fullName ||
    user.name ||
    email.split("@")[0] ||
    "Customer";

  await Customer.findOneAndUpdate(
    { email },
    {
      name: customerName,
      email,
      phone: user.phone || "Not provided",
      address: user.address || "",
      notes: "Created automatically from customer account",
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

export const register = async (req, res, next) => {
  try {
    const { name, fullName, email, password } = req.body;

    if ((!name && !fullName) || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const role = getRoleByEmail(normalizedEmail);

    const user = await User.create({
      name: name || fullName,
      fullName: fullName || name,
      email: normalizedEmail,
      password,
      role,
    });

    await saveCustomerFromUser(user);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    const correctRole = getRoleByEmail(user.email);

    if (user.role !== correctRole) {
      user.role = correctRole;
      await user.save();
    }

    await saveCustomerFromUser(user);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    next(err);
  }
};