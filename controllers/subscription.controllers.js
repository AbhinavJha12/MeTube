import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



//check again
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "channel does not exist")
    }
   
    //check if already subscribed
    // const channel = await User.find({_id:channelId})

    const subscriptionDoc = await Subscription.find({subscriber : req.user._id, channel: channel._id})
    if(subscriptionDoc){
        // unsubscribe
        const result = await Subscription.findByIdAndDelete(subscriptionDoc._id);
        return res
                .status(201)
                .json(
                    new ApiResponse(201,{},"Unsubscribed Successfully")
                )
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "subscribed successfully"
            )
        )

    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid userid")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel:   new mongoose.Types.ObjectId(channelId)
            },
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"
            },
        }
    ])
    

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers.subscribers, "Subscribers channel fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid userid")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                subscriber:   new mongoose.Types.ObjectId(channelId)
            },
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"channels"
            },
        }
    ])
    

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers.channels, "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}