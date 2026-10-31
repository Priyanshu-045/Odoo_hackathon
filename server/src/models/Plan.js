// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import mongoose from 'mongoose';
const planSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  interval: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
  tax_rate: { type: Number, default: 0, min: 0, max: 100 },
  discount_pct: { type: Number, default: 0, min: 0, max: 100 },
  active: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Plan', planSchema);
