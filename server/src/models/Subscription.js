// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;
const subscriptionSchema = new mongoose.Schema({
  customer: { type: ObjectId, ref: 'User', required: true, index: true },
  plan: { type: ObjectId, ref: 'Plan', required: true, index: true },
  quantity: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ['draft', 'quotation', 'confirmed', 'active', 'cancelled'], default: 'draft' },
  start_date: Date,
  next_billing_date: Date,
  discount_pct: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

// Draft -> Quotation -> Confirmed -> Active
const NEXT = { draft: 'quotation', quotation: 'confirmed', confirmed: 'active' };
subscriptionSchema.methods.advance = function () {
  const next = NEXT[this.status];
  if (!next) throw new Error('Cannot advance from "' + this.status + '"');
  this.status = next;
  if (next === 'active') {
    this.start_date ??= new Date();
    this.next_billing_date ??= this.start_date;
  }
  return this.save();
};

subscriptionSchema.index({ status: 1, next_billing_date: 1 });
export default mongoose.model('Subscription', subscriptionSchema);
