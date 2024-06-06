import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.js"
import {User} from "../models/user.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/fileUpload.js"
import { deleteOnCloudinary } from "../utils/fileUpload.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pipeline = [];

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }

   
    pipeline.push({ $match: { isPublished: true } });

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar": 1
                        }
                    }
                ]
            }
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if([title,description].some((field)=>{field.trim()===""})){
        throw new ApiError(400,"title or description missing")
    }
    const videoLocalPath = req.files?.videoFile[0]?.path;

    let thumbanailLocalPath;
    if (req.files && Array.isArray(req.files.thumbanail) && req.files.thumbnail.length > 0) {
        thumbanailLocalPath = req.files.thumbnail[0].path
    }

    if(!videoLocalPath){
        throw new ApiError(400,"No video selected")
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbanailLocalPath)

    const video = await Video.create({
        vdeoFile: videoUpload.url,
        thumbnail: thumbnail?.url||"",
        title:title,
        description:description,
        duration: videoFile.duration,
        isPublished:false,
        owner:req.user?._id
    })

    if(!video){
        throw new ApiError(400,"Cant upload on db")
    }

    return res.status(200).json(new ApiResponse(200,video,"vedio uploaded succesfully"))



    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid vidoId")
    }
    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        username:1
                    }
                }
                ]   
            }
        }
    ])
    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

  
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });
    await User.findByIdAndUpdate(req.user?._id, {
        $push: {
            watchHistory: videoId
        }
    });

    return res.status(200).json(
        new ApiResponse(200,video,"video fetched successfully")
    )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    if(!isValidObjectId(videoId)){
        throw new ApiError(200,"invalid vedio id")
    }
    const video = await Video.findbyId(videoId)
    if(!video){
        throw new ApiError(400,"no such video exist")
    }
    if(video.owner!=req.user._id){
        throw new ApiError(400,"you dont have access to this video")
    }
    
    if(title){
       await video.updateOne({
            $set:{
                title:title
            }
            
        },
        { new: true }
        )
    }
    if(description){
        await video.updateOne({
            $set:{
                description:description
            }
        },
        { new: true })
    }

    
    if (req.files && Array.isArray(req.files.thumbanail) && req.files.thumbnail.length > 0) {
        let thumbanailLocalPath;
        thumbanailLocalPath = req.files.thumbnail[0].path
        const oldThumbnail = video.thumbanail
        const newThumbnail = await uploadOnCloudinary(thumbanailLocalPath)
        await deleteOnCloudinary(oldThumbnail)
        await video.updateOne({
            $set:{
                thumbanail: newThumbnail.url
            }
        },{ new: true })
    }

    return res.status(200).json(new ApiResponse(200,video,"updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner !== req.user?._id) {
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if (!videoDeleted) {
        throw new ApiError(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.thumbnail);
    await deleteOnCloudinary(video.videoFile);

    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner != req.user?._id) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}