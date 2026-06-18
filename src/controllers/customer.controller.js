import Customer from "../models/Customer.model.js";

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, notes } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        message: "Phone is required",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      address: address || "",
      notes: notes || "",
    });

    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, notes } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        address,
        notes,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};