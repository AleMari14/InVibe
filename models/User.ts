import mongoose, { Schema, model, type Document } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  image?: string
  favorites: mongoose.Types.ObjectId[]
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: String,
    favorites: [{ type: Schema.Types.ObjectId, ref: "Event", default: [] }],
  },
  { timestamps: true },
)

// evita di ricreare il modello in hot-reload
export default (mongoose.models.User as mongoose.Model<IUser>) || model<IUser>("User", userSchema)
