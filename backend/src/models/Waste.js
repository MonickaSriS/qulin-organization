import mongoose from 'mongoose';

const wasteSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    item: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    wasteQty: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: ['overproduction', 'spoilage', 'preparation', 'plate_waste', 'damaged'],
      required: true,
    },
  },
  { timestamps: true }
);

wasteSchema.index({ orgId: 1, branchId: 1, item: 1, date: 1 });

export default mongoose.model('Waste', wasteSchema);
