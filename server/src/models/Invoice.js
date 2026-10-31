// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const invoiceSchema = new mongoose.Schema({
  subscription: { type: ObjectId, ref: 'Subscription', required: true },
  customer: { type: ObjectId, ref: 'User', required: true, index: true },
  plan: { type: ObjectId, ref: 'Plan', required: true },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  subtotal: Number,
  discount: Number,
  tax: Number,
  total: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'confirmed', 'paid', 'overdue', 'void'], default: 'draft' },
  due_date: Date,
}, { timestamps: true });

// One invoice per subscription per period: safe against double cron/simulator runs
invoiceSchema.index({ subscription: 1, period_start: 1 }, { unique: true });
invoiceSchema.index({ status: 1, due_date: 1 });
export default mongoose.model('Invoice', invoiceSchema);
