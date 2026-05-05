const mongoose = require("mongoose");

const InstrumentSchema = new mongoose.Schema({
  instrumentId: String,
  name: String,
  usageCount: Number,
});

const PhaseSchema = new mongoose.Schema({
  phaseId: Number,
  phaseName: String,
  startTime: String,
  endTime: String,
  completed: Boolean,
  mainActions: [String],
});

const ErrorSchema = new mongoose.Schema({
  errorId: String,
  time: String,
  phaseId: Number,
  type: String,
  description: String,
  severity: String,
  scorePenalty: Number,
});

const PerformanceMetricsSchema = new mongoose.Schema({
  totalScore: Number,
  precisionScore: Number,
  timeScore: Number,
  safetyScore: Number,
  instrumentHandlingScore: Number,
  collaborationScore: Number,
  totalErrors: Number,
  criticalErrors: Number,
  wrongInstrumentCount: Number,
  excessivePressureCount: Number,
  collisionWithCriticalZoneCount: Number,
  bleedingEvents: Number,
  csfLeak: Boolean,
  tumorRemovalPercent: Number,
  trajectoryLengthMeters: Number,
  averageHandStability: Number,
});

const CertificationSchema = new mongoose.Schema({
  isValidated: Boolean,
  threshold: Number,
  certificationName: String,
  issuedAt: Date,
});

const FormationSchema = new mongoose.Schema(
  {
    operationId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentName: String,
    scenarioName: { type: String, required: true },
    operationType: String,
    dateStart: { type: Date, required: true },
    dateEnd: Date,
    durationSeconds: Number,
    status: {
      type: String,
      enum: ["completed", "in_progress", "abandoned"],
      default: "completed",
    },
    attemptNumber: { type: Number, default: 1 },
    phases: [PhaseSchema],
    instrumentsUsed: [InstrumentSchema],
    performanceMetrics: PerformanceMetricsSchema,
    errors: [ErrorSchema],
    feedback: {
      globalComment: String,
      positivePoints: [String],
      improvementPoints: [String],
    },
    certification: CertificationSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Formation", FormationSchema);