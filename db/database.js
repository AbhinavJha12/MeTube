import mongoose from "mongoose";

export const connectDB = () => {
  try {
    console.log("hahahah");
    mongoose
      .connect(process.env.MONGO_URL, {
        dbName: "backendapi",
      })
      .then((c) => console.log(`Database Connected with ${c.connection.host}`))
      .catch((e) => console.log(e));
  } catch (error) {
console.log("db faile")
  }
};