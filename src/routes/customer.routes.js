import express from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/", getCustomers);

router.post("/", createCustomer);

router.put("/:id", updateCustomer);

router.patch("/:id", updateCustomer);

router.delete("/:id", deleteCustomer);

export default router;