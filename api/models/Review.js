import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, default: '', maxlength: 1000 },

    serviceQuality: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    staffBehaviour: { type: Number, min: 1, max: 5 },

    stationReply: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
)

reviewSchema.index({ station: 1, createdAt: -1 })

reviewSchema.statics.refreshStationRating = async function refreshStationRating (stationId) {
  const stats = await this.aggregate([
    { $match: { station: new mongoose.Types.ObjectId(String(stationId)), isHidden: false } },
    {
      $group: {
        _id: '$station',
        average: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ])

  const result = stats[0] || { average: 0, count: 0 }
  const Station = mongoose.model('Station')
  await Station.findByIdAndUpdate(stationId, {
    'rating.average': Math.round((result.average || 0) * 10) / 10,
    'rating.count': result.count
  })

  return result
}

export const Review = mongoose.model('Review', reviewSchema)
export default Review