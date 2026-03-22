const mongoose = require('mongoose');

const hourBlockSchema = new mongoose.Schema({
  hourIndex: { type: Number, required: true }, // 0-23
  startTime: { type: String }, // "09:00"
  endTime: { type: String },   // "10:00"
  activity: { type: String, default: '' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  studyMinutes: { type: Number, default: 45 },
  breakMinutes: { type: Number, default: 15 },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  timerStarted: { type: Date },
  timerPhase: { type: String, enum: ['study', 'break', 'idle'], default: 'idle' }
});

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // "2024-01-15" YYYY-MM-DD
    required: true
  },
  hourBlocks: [hourBlockSchema],
  totalPoints: {
    type: Number,
    default: 0
  },
  totalStudyTime: {
    type: Number,
    default: 0 // in minutes
  },
  hoursCompleted: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for user + date
sessionSchema.index({ user: 1, date: 1 }, { unique: true });

// Calculate total points from hour blocks
sessionSchema.methods.calculatePoints = function() {
  let points = 0;
  this.hourBlocks.forEach(block => {
    if (block.completed) {
      points += block.rating * 10; // Max 50 points per hour
    }
  });
  this.totalPoints = points;
  this.hoursCompleted = this.hourBlocks.filter(b => b.completed).length;
  return points;
};

module.exports = mongoose.model('Session', sessionSchema);
