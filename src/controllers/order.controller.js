import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Customer from "../models/Customer.model.js";

const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"];

function isActiveOrder(status) {
  return status !== "cancelled";
}

function isValidObjectId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function readValueFromNotes(notes, label) {
  const lines = String(notes || "").split("\n");

  const line = lines.find((item) =>
    item.toLowerCase().startsWith(label.toLowerCase() + ":")
  );

  if (!line) return "";

  return line.substring(line.indexOf(":") + 1).trim();
}

async function saveCustomerFromOrder(orderData) {
  const customerName =
    orderData.customerName ||
    readValueFromNotes(orderData.notes, "Customer name") ||
    "Customer";

  const customerEmail = normalizeEmail(
    orderData.customerEmail ||
      orderData.email ||
      readValueFromNotes(orderData.notes, "Customer email")
  );

  const customerPhone =
    orderData.customerPhone ||
    readValueFromNotes(orderData.notes, "Phone") ||
    "Not provided";

  const customerAddress =
    orderData.customerAddress ||
    readValueFromNotes(orderData.notes, "Address") ||
    "غير معروف";

  const customerNotes =
    readValueFromNotes(orderData.notes, "Customer notes") ||
    orderData.customerNotes ||
    "";

  const filter = customerEmail
    ? { email: customerEmail }
    : { name: customerName, phone: customerPhone };

  await Customer.findOneAndUpdate(
    filter,
    {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: customerAddress,
      notes: customerNotes || "Created automatically from customer order",
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function buildOrderData(body, oldOrder = null) {
  const quantity = Number(body.quantity ?? oldOrder?.quantity ?? 1);
  const status = body.status || oldOrder?.status || "pending";

  let data = {
    customerId: oldOrder?.customerId,
    productId: oldOrder?.productId,

    customerName: body.customerName ?? oldOrder?.customerName ?? "",
    customerPhone: body.customerPhone ?? oldOrder?.customerPhone ?? "",
    customerAddress: body.customerAddress ?? oldOrder?.customerAddress ?? "",

    productName: body.productName ?? oldOrder?.productName ?? "",
    quantity,
    unitPrice: Number(
      body.unitPrice ?? body.price ?? oldOrder?.unitPrice ?? oldOrder?.price ?? 0
    ),
    status,
    paymentMethod: body.paymentMethod || oldOrder?.paymentMethod || "cash",
    notes: body.notes ?? oldOrder?.notes ?? "",
  };

  if (isValidObjectId(body.customerId)) {
    data.customerId = body.customerId;

    const customer = await Customer.findById(body.customerId);

    if (customer) {
      data.customerName = customer.name;
      data.customerPhone = customer.phone;
      data.customerAddress = customer.address || "";
    }
  }

  if (isValidObjectId(body.productId)) {
    data.productId = body.productId;

    const product = await Product.findById(body.productId);

    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    data.productName = product.name;
    data.unitPrice = Number(product.price);
  }

  data.totalPrice = Number(data.quantity) * Number(data.unitPrice);

  return data;
}

export const createOrder = async (req, res, next) => {
  try {
    const data = await buildOrderData(req.body);

    if (!data.customerName || data.customerName.trim() === "") {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!data.productName || data.productName.trim() === "") {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (!data.quantity || Number(data.quantity) <= 0) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    if (!data.unitPrice || Number(data.unitPrice) <= 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    if (!ORDER_STATUSES.includes(data.status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (data.productId && isActiveOrder(data.status)) {
      const product = await Product.findById(data.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (Number(product.stock) < Number(data.quantity)) {
        return res.status(400).json({
          message: `Not enough stock. Available stock: ${product.stock}`,
        });
      }

      await Product.findByIdAndUpdate(data.productId, {
        $inc: { stock: -Number(data.quantity) },
      });
    }

    const order = await Order.create(data);

    await saveCustomerFromOrder(data);

    const populatedOrder = await Order.findById(order._id)
      .populate("productId")
      .populate("customerId");

    res.status(201).json(populatedOrder);
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("productId")
      .populate("customerId")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId")
      .populate("customerId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const oldOrder = await Order.findById(req.params.id);

    if (!oldOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const data = await buildOrderData(req.body, oldOrder);

    if (!ORDER_STATUSES.includes(data.status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const oldWasActive = isActiveOrder(oldOrder.status);
    const newIsActive = isActiveOrder(data.status);

    const oldProductId = oldOrder.productId?.toString();
    const newProductId = data.productId?.toString();

    if (newIsActive && newProductId) {
      const product = await Product.findById(newProductId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let availableStock = Number(product.stock);

      if (oldWasActive && oldProductId === newProductId) {
        availableStock += Number(oldOrder.quantity || 1);
      }

      if (availableStock < Number(data.quantity)) {
        return res.status(400).json({
          message: `Not enough stock. Available stock: ${availableStock}`,
        });
      }
    }

    if (oldWasActive && oldProductId) {
      await Product.findByIdAndUpdate(oldProductId, {
        $inc: { stock: Number(oldOrder.quantity || 1) },
      });
    }

    if (newIsActive && newProductId) {
      await Product.findByIdAndUpdate(newProductId, {
        $inc: { stock: -Number(data.quantity) },
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    })
      .populate("productId")
      .populate("customerId");

    await saveCustomerFromOrder(data);

    res.status(200).json(updatedOrder);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const oldWasActive = isActiveOrder(order.status);
    const newIsActive = isActiveOrder(status);

    if (order.productId) {
      if (oldWasActive && !newIsActive) {
        await Product.findByIdAndUpdate(order.productId, {
          $inc: { stock: Number(order.quantity || 1) },
        });
      }

      if (!oldWasActive && newIsActive) {
        const product = await Product.findById(order.productId);

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        if (Number(product.stock) < Number(order.quantity)) {
          return res.status(400).json({
            message: `Not enough stock. Available stock: ${product.stock}`,
          });
        }

        await Product.findByIdAndUpdate(order.productId, {
          $inc: { stock: -Number(order.quantity || 1) },
        });
      }
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("productId")
      .populate("customerId");

    res.status(200).json(updatedOrder);
  } catch (err) {
    next(err);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.productId && isActiveOrder(order.status)) {
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { stock: Number(order.quantity || 1) },
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Customer.countDocuments();

    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const completedOrders = await Order.countDocuments({ status: "completed" });
    const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

    const lowStockProducts = await Product.countDocuments({
      stock: { $lte: 5 },
    });

    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.status(200).json({
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      lowStockProducts,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
    });
  } catch (err) {
    next(err);
  }
};