import {v2 as cloudinary} from 'cloudinary';
import dotenv from 'dotenv';
import fs from "fs";

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
         console.log(typeof(process.env.CLOUDINARY_API_KEY))   
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log(response)
       
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.log(error)
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary}