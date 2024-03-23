import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



//check again
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const channel_id = await User.findOne({
        $or: [{channelId}]
    })
    if (!channel_id) {
        throw new ApiError(404, "channel does not exist")
    }
    const user = req.user.username
    const subscribe_doc = await Subscription.create({
        user,
        channel_id
    })
    if(subscribe_doc){
        return res
            .status(200)
            .json(new ApiResponse(200,_,"subscribed successfully"))
    }
    else{
        throw new ApiError(409, "Not able to subscribe, try never again")
    }
   
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const subscribers = await Subscription.aggregate(
        [
            {
                $match: {
                    username: channelId?.toLowerCase()
                }
            }
        ]
    )
    if (!subscribers?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers[0], "Subscribers channel fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const Channels = await Subscription.aggregate(
        [
            {
                $match: {
                    username: subscriberId?.toLowerCase()
                }
            }
        ]
    )
    if (!Channels?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, Channels[0], "Subscribers channel fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}