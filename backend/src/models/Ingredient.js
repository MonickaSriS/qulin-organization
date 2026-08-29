import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, enum: ['kg', 'g', 'l', 'ml', 'unit'], required: true },
    currentStock: { type: Number, required: true, min: 0 },
    costPerUnit: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

ingredientSchema.index({ orgId: 1, branchId: 1, name: 1 });

export default mongoose.model('Ingredient', ingredientSchema);
