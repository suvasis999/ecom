const CronJob = require('cron').CronJob;
const Product = require("../model/ecom/product")
const VendorDetails = require("../model/ecom/ecom_vendor_details")
const mongoose = require("mongoose")

const job = new CronJob('*/10 * * * * *', async function () {
    try {
        //finding all package expired vendors 
        const expiredVendor = await VendorDetails.aggregate(
            [
                {
                    $match: {
                        active_package: { $exists: true },
                        "package_details.valid_to": { $lt: new Date() }
                    },
                },
                {
                    $project: {
                        "vendor_id": 1
                    }
                }
            ]);
        console.log("expiredVendor", expiredVendor)
        
        if (expiredVendor.length) {
            expiredVendor.forEach(async (vendor) => {
                //********************************************* */
                // NOTE : Here we should mail to vendor that his package is expired and product is freezed
                //********************************************* */
                
                const vendorID = vendor.vendor_id
                
                const vendorDetail = await VendorDetails.findOne({ vendor_id: vendorID })
                console.log(vendorDetail)
                //if upcoming package is present then activate this.
                console.log("Upcoming--------------------------",vendorDetail.upcoming_package.package)
                // return
                if (vendorDetail.upcoming_package.package) {
                    const up_package = vendorDetail.upcoming_package.package
                    const up_validity = vendorDetail.upcoming_package.validity_days
                    const up_p_size = vendorDetail.upcoming_package.max_product_size
                    const validTo = new Date();
                    validTo.setDate(validTo.getDate() + up_validity);
                    
                    let prevUploaded = 0

                    //previously unsold products
                    const unsold_products = await Product.aggregate(
                        [
                            {
                                $match: {
                                    vendor_id: mongoose.Types.ObjectId(vendorID)
                                }
                            },
                            {
                                $group:
                                {
                                    _id: "",
                                    unsold: { $sum: "$stock" },
                                }
                            },
                            {
                                $project: {
                                    _id: "0",
                                    total_unsold: {
                                        $sum: "$unsold"
                                    }
                                }
                            }
                        ]
                    )
                    console.log("unsold_products",unsold_products)
                    const unsold = unsold_products[0].total_unsold
                    //if previously unsold products larger than package capacity
                    if (unsold >= up_p_size) {
                        //product freezing
                        const freezProduct = await Product.updateMany({ vendor_id: vendorID }, { isActive: false })
                        console.log("freezProduct",freezProduct)
                    }
                    else{
                        // save as product uploaded. count as already uploaded product
                        prevUploaded = unsold
                    }
                    
                    const prevPackage = {
                        ...vendorDetail.package_details,
                        isActive: false
                    }
                    const update = {
                        active_package: up_package,
                        $push: {
                            package_history: prevPackage
                        },
                        package_details: {
                            package: up_package,
                            isActive: true,
                            active_from: new Date(),
                            product_uploaded: prevUploaded,
                            valid_to: validTo,
                            max_product_size: up_p_size
                        },
                        upcoming_package: null,
                    }
                   const u =  await VendorDetails.findOneAndUpdate({ vendor_id: vendorID }, update)
                    console.log("upDRW", u)
                }
                else {
                    console.log("freezing")
                    console.log("vendorID", vendorID)
                    //product freezing
                    const freezProduct = await Product.updateMany({ vendor_id: vendorID }, { isActive: false })
                    console.log("freezProduct", freezProduct)
                    console.log("vendorDetail", vendorDetail)
                    const inActiveVendor = {
                        active_package: null,
                        $push: {
                            package_history: {
                                ...vendorDetail.package_details,
                                isActive: false
                            }
                        },
                        package_details: null,
                    }
                    console.log("updated data", inActiveVendor)
                    // change the vendor package details
                    const inv = await VendorDetails.findOneAndUpdate({ vendor_id: vendorID }, inActiveVendor)
                    console.log("inactivendr", inv)

                }
            })
        }
        const d = new Date();
        console.log('Every second:', d);

    }
    catch (er) {
        throw er
    }
});
module.exports = job