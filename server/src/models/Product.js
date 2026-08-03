import mongoose from 'mongoose';

const PRODUCT_CATEGORIES = ['Fresh', 'Value-Added', 'Farm Inputs'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, enum: PRODUCT_CATEGORIES },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0.01 },
    unit: { type: String, default: 'unit', trim: true, maxlength: 20 },
    image: { type: String, default: null },
    isHarvestedToday: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    stockQty: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text' });

productSchema.methods.stockStatus = function stockStatus() {
  if (this.stockQty <= 0) return 'Out of Stock';
  if (this.stockQty <= this.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
};

export const PRODUCT_CATEGORY_VALUES = PRODUCT_CATEGORIES;
export const Product = mongoose.model('Product', productSchema);
