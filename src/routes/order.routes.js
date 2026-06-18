import express from "express";

import {
  createOrder,
  deleteOrder,
  getDashboardStats,
  getOrderById,
  getOrders,
  updateOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

router.get("/stats/summary", getDashboardStats);

router.get("/", getOrders);

router.get("/:id", getOrderById);

router.post("/", createOrder);

router.put("/:id", updateOrder);

router.patch("/:id", updateOrder);

router.patch("/:id/status", updateOrderStatus);

router.delete("/:id", deleteOrder);

export default router;