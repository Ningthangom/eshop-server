const { Category } = require('../models/category')
const {Order } = require('../models/order');
const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
const { OrderItem } = require('../models/orderItem');



// get orders 
router.get('/', async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered':-1});
    if(!orderList){
        res.status(500).json({success: false, message: 'there is no order '});
    }
    res.send(orderList);
})


//get order with id 
router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({ 
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'}});
   
    if(!order){
        return res.status(500).json({success: false, message: 'there is no order with id'});
    }

    res.send(order);
})


// update status of the order 
router.put('/:id', async (req, res) => {
        // check if the id is a valid mongo id 
   if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({success: false, message:"invalid product id"})
}
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        }, 
        {new: true}
        )
        if(!order){
           return res.status(400).send('update was not successful')
        }
        res.send(order)
})



// delete order and ids from orderItems
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id)
    .then(async order => {
        if(order){
            await order.orderItems.map(async orderitem => {
               await OrderItem.findByIdAndRemove(orderitem)
            })
            res.status(200).json({success: true, message: 'order and order items have been deleted'})
        } else{
            res.status(500).json({success: false, message: 'delete was not successful'})
        }
    })
    .catch((err) => {
        res.status(400).json({success: false, message: err})
    })
})


// create new order
router.post('/', async (req, res) => {
    const orderItemIds = Promise.all(req.body.orderItems.map( async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemIds;
    console.log(orderItemIds);

    const totalPrices = await Promise.all(orderItemsIdsResolved.map( async(orderItemId) => {
             const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
             const totalPrice = orderItem.product.price * orderItem.quantity;
             return totalPrice;
    }));

    // this will print out total price of each order item
    console.log('this is totalPrices of each item', totalPrices);

    // adding all total prices from the whole order 
    const  totalPrice = totalPrices.reduce((a,b) => a+b, 0);
    console.log('this is total price for the whole order', totalPrice);

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        ShippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })

    order = await order.save();
    if(!order){
        return res.status(400).json({success: false, message: "order could not be placed"});
    }
    res.send(order);
})


// checking the total sales 
router.get('/get/totalsales',async  (req,res) => {
    const totalSales = await Order.aggregate([
        {$group: {_id: null, totalsales: { $sum: '$totalPrice'}}}
    ])
    if(!totalSales) {
        return res.status(400).send('total sales can not be generated')
    }
    res.send({ totalsales: totalSales.pop().totalsales });

})

// order count
router.get(`/get/sale_count` , async (req, res) => {
    const salesCount = await Order.countDocuments();
    if(!salesCount) {
        return res.status(500).json({success: false, message:"Order count could not be generated"})
    }
    res.send({ 
        totalOrder: salesCount
    });
})


// get order for a user 
router.get('/get/userorders/:userid', async (req, res) => {
    const userOrderList = await Order.find({user: req.params.userid})
    .populate({ 
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'}}).sort({'dateOrdered':-1});
    if(!userOrderList){
        res.status(500).json({success: false, message: 'there is no order '});
    }
    res.send(userOrderList);
})



module.exports  = router;  