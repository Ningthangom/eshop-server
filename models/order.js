const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({ 
    // this object is in an array as there might be more than one item in order
    orderItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem', 
        required:true
    }],
    shippingAddress1: {
        type: String,
        required:true

    },
    ShippingAddress2: {
        type: String,
    },
    city: {
        type: String,
        required:true
    },
    zip: {
        type: String,
        required:true
    },
    country: {
        type: String,
        required:true
    },
    phone: {
        type: String,
        required:true
    },
    status: {
        type: String,
        required:true,
        default: 'Pending'
    },
    totalPrice: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
     /*    required: true  */
        
    },
    dateOrdered: {
        type: Date,
        default: Date.now
    }

})

// changing _id to id
orderSchema.virtual('id').get(function(){
    return this._id.toHexString();
})

orderSchema.set('toJSON', { 
    virtuals: true
})

exports.Order = mongoose.model('Order', orderSchema)