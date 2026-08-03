import mongoose from 'mongoose';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const DELIVERY_METHODS = ['Lalamove', 'Self-Pickup'];
const PAYMENT_STATUSES = ['Pending', 'Verified', 'Rejected'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

// The original schema had two parallel enums moving in lockstep
// (orders.payment_status: Unpaid/Pending Verification/Paid/Rejected,
// payments.status: Pending/Verified/Rejected) because every order always
// gets a payment row at creation, so "Unpaid" never actually occurred.
// Collapsed here to one field; UI maps Pending->"Pending Verification",
// Verified->"Paid", Rejected->"Rejected" for identical display copy.
const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, default: 'GCash' },
    referenceNumber: { type: String, default: null },
    receiptImage: { type: String, default: null },
    amount: { type: Number, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'Pending' },
    adminNote: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderDate: { type: Date, default: Date.now },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    deliveryMethod: { type: String, enum: DELIVERY_METHODS, required: true },
    deliveryAddress: { type: String, default: null },
    deliveryLandmark: { type: String, default: null },
    deliveryLat: { type: Number, default: null },
    deliveryLng: { type: Number, default: null },
    pickupDate: { type: String, default: null },
    pickupTime: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    payment: { type: paymentSchema, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: 'updatedAt' } }
);

orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

export const ORDER_STATUS_VALUES = ORDER_STATUSES;
export const DELIVERY_METHOD_VALUES = DELIVERY_METHODS;
export const PAYMENT_STATUS_VALUES = PAYMENT_STATUSES;
export const Order = mongoose.model('Order', orderSchema);
