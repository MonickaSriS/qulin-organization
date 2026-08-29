import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Branch', branchSchema);
