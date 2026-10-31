// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  category: { type: String, index: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Product', productSchema);
