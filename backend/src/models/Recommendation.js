import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    item: { type: String, required: true },
    date: { type: Date, required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    riskBand: { type: String, enum: ['red', 'orange', 'green'], required: true },
    cause: { type: String, required: true },
    evidence: { type: String, required: true },
    recommendation: { type: String, required: true },
    suggestedQty: { type: Number },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

recommendationSchema.index({ orgId: 1, branchId: 1, item: 1, date: 1 });

export default mongoose.model('Recommendation', recommendationSchema);
