import mongoose, { Schema, model, type Document } from "mongoose"

export interface IEvent extends Document {
  title: string
  description: string
  dateStart: Date
  hostId: mongoose.Types.ObjectId
  locationCoords?: {
    type: "Point"
    coordinates: [number, number] // [lng, lat]
  }
  image?: string
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dateStart: { type: Date, required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    locationCoords: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    image: String,
  },
  { timestamps: true },
)

eventSchema.index({ locationCoords: "2dsphere" })

export default (mongoose.models.Event as mongoose.Model<IEvent>) || model<IEvent>("Event", eventSchema)
