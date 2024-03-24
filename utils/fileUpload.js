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
        //  console.log(typeof(process.env.CLOUDINARY_API_KEY))   
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log(response)
       
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.log(error)
        fs.unlinkSync(localFilePath)
        return null;
    }
}
const deleteOnCloudinary = async (CloudinaryUrl) => {
    if(!CloudinaryUrl)return null
    try{
        var parts = CloudinaryUrl.split("/");
        var result = parts[parts.length - 1];
        result = result.split(".")[0];
        // console.log(result)
       const response = await cloudinary.uploader
       .destroy(result)
       .then(result => console.log(result));
        return response;

    }
    catch (error) {
        console.log(error + "delete nhi ho rha")
        
        return null;
    }
}
export {uploadOnCloudinary, deleteOnCloudinary}