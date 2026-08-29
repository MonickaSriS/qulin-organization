import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    item: { type: String, required: true, trim: true },
    meal: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    date: { type: Date, required: true },
    preparedQty: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Supports the perf work in Phase 11, and every query pattern used from Phase 3 onward
productionSchema.index({ orgId: 1, branchId: 1, item: 1, date: 1 });

export default mongoose.model('Production', productionSchema);
