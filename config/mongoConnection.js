import mongoose from 'mongoose'
import config from 'config'

const MONGO_DB_URL = config.get('mongo-db-url') || 'mongodb://localhost:27017/atomic'

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
export default async () => {
  await mongoose
    .connect(MONGO_DB_URL, options)
    .then(() => console.log('✅ MongoDB is connected'))
    .catch((err) => console.log(`❌ Not Connected to MongoDB' + ${err}`))
}
