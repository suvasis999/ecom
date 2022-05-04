const User = require("../models/User");
const Vendor = require("../models/vendor");
const server_url = process.env.SERVER_URL
const Validation = require("../config/validation")
const role = require("../config/role")
module.exports.apply = async function (req, res, next) {
    try {
        const {
            user_id,
            email,
            name,
            phone,
            company_name,
        } = req.body
        const existUser = await User.findById(user_id)
        if (existUser == null) {
            return res.status(400).json({ msg: 'user not found', status: false })
        }
        const existVendor = await Vendor.findOne({ user_id })
        if (existVendor != null) {
            return res.status(400).json({ msg: 'Already applied for vendor', status: false })
        }
        //create new user
        const newVendor = await Vendor.create({
            user_id,
            email,
            name,
            phone,
            company_name,
        });

        //save user and respond
        res.status(200).json({ data: newVendor, msg: 'Applied for vendor. Please wait for approval', status: true });
    } catch (err) {
        next(error)
    }
};

module.exports.uploadId = async (req, res, next) => {
    try {
        if (!req.files) {
            return res.status(400).json({ msg: 'Photo is required', status: false })
        }
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ msg: 'Vendor id  is required', status: false })
        }
        let update = {}
        update.doc_1 = server_url + req.files['doc_1'][0].path;
        update.doc_2 = server_url + req.files['doc_2'][0].path;
        update.doc_3 = server_url + req.files['doc_3'][0].path;

        Vendor.findByIdAndUpdate(id, update, er => {
            if (!er) {
                res.json({ msg: 'All id uploaded ', status: true })
            }
            else {
                res.json({ msg: 'Something went wrong please try again', status: true })
            }
        })
    }
    catch (error) {
        next(error)
    }
}
module.exports.editVendor = async (req, res, next) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ msg: 'Vendor id  is required', status: false })
        }
        const {
            email,
            name,
            phone,
            company_name,
        } = req.body
        const update = Validation.updateData([
            { email }, { name }, { phone }, { company_name }
        ])
        let existVendor = await Vendor.findById(id)
        if (!existVendor) {
            return res.status(400).json({ msg: 'Vendor not found.', status: false })
        }
        await Vendor.findByIdAndUpdate(id, update)
        res.json({ msg: 'Vendor profile updated', status: true })
    }
    catch (error) {
        next(error)
    }
}
module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ msg: 'Vendor id  is required', status: false })
        }

        let existVendor = await Vendor.findById(id)
        if (existVendor != null) {
            return res.status(200).json({ msg: 'Vendor  found.', status: true, data:existVendor })
        }
        else{
            return res.status(400).json({ msg: 'Vendor not found.', status: false,})

        }

       
    }
    catch (error) {
        next(error)
    }
}
module.exports.getByUserId = async (req, res, next) => {
    try {
        const id = req.params.user_id
        if (!id) {
            return res.status(400).json({ msg: 'user id  is required', status: false })
        }

        let existVendor = await Vendor.findOne({user_id:id})
        if (existVendor != null) {
            return res.status(200).json({ msg: 'Vendor  found.', status: true, data:existVendor })
        }
        else{
            return res.status(400).json({ msg: 'Vendor not found.', status: false,})

        }

       
    }
    catch (error) {
        next(error)
    }
}
module.exports.approveVendor = async (req, res, next) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({ msg: 'Vendor id  is required', status: false })
        }

        let existVendor = await Vendor.findById(id)
        if (!existVendor) {
            return res.status(400).json({ msg: 'Vendor not found.', status: false })
        }

        await Vendor.findByIdAndUpdate(id, { status: "Approved" })
        await User.findOneAndUpdate({ _id: existVendor.user_id }, { role: role.VENDOR })
        res.json({ msg: 'Vendor profile Approved', status: true })
    }
    catch (error) {
        next(error)
    }
}
module.exports.rejectVendor = async (req, res, next) => {
    try {
        const id = req.params.id
        const reject_reason = req.body.reject_reason
        if (!id) {
            return res.status(400).json({ msg: 'Vendor id  is required', status: false })
        }

        let existVendor = await Vendor.findById(id)
        if (!existVendor) {
            return res.status(400).json({ msg: 'Vendor not found.', status: false })
        }

        await Vendor.findByIdAndUpdate(id, { status: "Rejected",reject_reason:reject_reason })
        await User.findOneAndUpdate({ _id: existVendor.user_id }, { role: role.BASIC })
        res.json({ msg: 'Vendor profile Rejected', status: true })
    }
    catch (error) {
        next(error)
    }
}
module.exports.getAllVendor = async (req, res, next) => {
    try {
        const vendorDetails = await Vendor.aggregate(
            [
                {
                    $lookup:
                    {
                        from: 'users',
                        let: { userId: "$user_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {
                                            $expr: {
                                                $eq: ["$$userId", "$_id"]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $project: {
                                    "name": 1,
                                    "email": 1,
                                    "role": 1,
                                    "address": 1,
                                }
                            }
                        ],
                        as: "user_details",
                    },
                },
            ]);
        if (vendorDetails != null) {
            res.json({ msg: 'All vendor found', status: true, data: vendorDetails })
        }
        else {
            res.json({ msg: 'Something went wrong please try again', status: true })
        }
    }
    catch (error) {
        next(error)
    }
}

module.exports.getPendingVendor = async (req, res, next) => {
    try {
        const vendorDetails = await Vendor.aggregate(
            [
                {
                    $match: {
                        status: "Pending"
                    }
                },
                { $sort: { createdAt: -1 } },
                {
                    $lookup:
                    {
                        from: 'users',
                        let: { userId: "$user_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {
                                            $expr: {
                                                $eq: ["$$userId", "$_id"]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $project: {
                                    "name": 1,
                                    "email": 1,
                                    "role": 1,
                                    "address": 1,
                                }
                            }
                        ],
                        as: "user_details",
                    },
                },
            ]);
        if (vendorDetails != null) {
            res.json({ msg: 'All pending vendor found', status: true, data: vendorDetails })
        }
        else {
            res.json({ msg: 'Something went wrong please try again', status: true })
        }
    }
    catch (error) {
        next(error)
    }
}
module.exports.getApprovedVendor = async (req, res, next) => {
    try {
        const vendorDetails = await Vendor.aggregate(
            [
                {
                    $match: {
                        status: "Approved"
                    }
                },
                {
                    $lookup:
                    {
                        from: 'users',
                        let: { userId: "$user_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {
                                            $expr: {
                                                $eq: ["$$userId", "$_id"]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $project: {
                                    "name": 1,
                                    "email": 1,
                                    "role": 1,
                                    "address": 1,
                                }
                            }
                        ],
                        as: "user_details",
                    },
                },
            ]);
        if (vendorDetails != null) {
            res.json({ msg: 'All approved vendor found', status: true, data: vendorDetails })
        }
        else {
            res.json({ msg: 'Something went wrong please try again', status: true })
        }
    }
    catch (error) {
        next(error)
    }
}
module.exports.getRejectedVendor = async (req, res, next) => {
    try {
        const vendorDetails = await Vendor.aggregate(
            [
                {
                    $match: {
                        status: "Rejected"
                    }
                },
                {
                    $lookup:
                    {
                        from: 'users',
                        let: { userId: "$user_id" },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {
                                            $expr: {
                                                $eq: ["$$userId", "$_id"]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $project: {
                                    "name": 1,
                                    "email": 1,
                                    "role": 1,
                                    "address": 1,
                                }
                            }
                        ],
                        as: "user_details",
                    },
                },
            ]);
        if (vendorDetails != null) {
            res.json({ msg: 'All rejected vendor found', status: true, data: vendorDetails })
        }
        else {
            res.json({ msg: 'Something went wrong please try again', status: true })
        }
    }
    catch (error) {
        next(error)
    }
}
module.exports.countVendor = async (req, res, next) => {
    try {
        const count = await Vendor.countDocuments({ status: "Approved" })
        if (count != null) {
            res.json({ msg: 'Vendor count', status: true, data: count })
        }
        else {
            res.status(400).json({ msg: 'Unable to count vendor', status: false })
        }
    }
    catch (error) {
        next(error)
    }
}