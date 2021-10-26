
const express = require('express');

const router = express.Router();

// Product is imported as object because of the way it's exported: exports.Product
const {Product} = require('../models/products')
const {Category} = require('../models/category')
const mongoose = require('mongoose');
const multer  = require('multer');



require('dotenv/config');

// setting extension for storing images
const File_Type_Map = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const validFile = File_Type_Map[file.mimetype];
        let uploadError = new Error('invalid image type');
        if(validFile){
            uploadError = null
        }
      cb(uploadError, 'public/upload')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('_')
      const extension = File_Type_Map[file.mimetype]
      cb(null, `${fileName}-${ Date.now()}.${extension}`)
    }
  })
  
  const uploadOption = multer({ storage: storage })

// express methods: get, post, put, delete

// without using async this get method returns error
// the data might not be ready yet
//get all the products 
router.get(`/` , async (req, res) => {
    // how to put items in the same category
    //localhost:3000/api/v1/products?categories= 121234,533232
        let filter = {};
        if(req.query.categories) {
            filter ={category: req.query.categories.split(',')}
            console.log('filter is run')
        }
    const productList = await Product.find(filter).populate('category').sort({'dateCreated': -1});
    if(!productList){
        res.status(500).json({success: false})
    }
     res.send(productList);
})


//get a single product 
router.get(`/:id` , async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    if(!product) {
        return res.status(500).json({success: false, message:"product does not exist"})
    }
    res.send(product);
})


// create a new product
 router.post(`/` , uploadOption.single('image') ,async (req, res) => {

// checking if the category exists
 const category = await Category.findById(req.body.category)
 if(!category) {
     return res.status(404).json({success:false, message:"invalid category"})
 }
 const imagefile = req.file;
 if(!imagefile) {
     return res.status(400).send('Please add image')
 }
 const filename = req.file.filename;
 const basePath = `${req.protocol}://${req.get('host')}/public/upload`

 let product = new Product({
    name: req.body.name,
    image:filename,
    image: `${basePath}${filename}`,
    description:req.body.description,
    richDescription:req.body.richDescription,
    brand: req.body.brand,
    price:req.body.price,
    category: req.body.category,
    countInStock:req.body.countInStock,
    rating:req.body.rating,
    numReview:req.body.numReview,
    isFeatured:req.body.isFeatured,
 })
 product = await product.save()
 if(!product) {
     return res.status(500).json({success:false, message:"product cannot be created"})
 }
 res.send(product)
}) 


// update a product 
router.put('/:id',uploadOption.single, async(req, res) =>{
    // check if the id is a valid mongo id 
   if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({success: false, message:"invalid product id"})
}
    const category = await Category.findById(req.body.category)
    if(!category) {
        return res.status(404).json({success:false, message:"invalid category"})
    }

    const productWithImage = await Product.findById(req.params.id);
    if(!productWithImage){
        return res.status(400).send('Invalid product');
    }

    const file = req.file;
    let imagePath;
    if(!file){
        const fileName = file.fileName;
        const basePath = `${req.protocol}://${req.get.host}/public/upload`;
        imagePath = `${basePath}${fileName}`
    }else {
        imagePath = productWithImage.image;
    }


    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
                name: req.body.name,
                image: imagePath,
                description:req.body.description,
                richDescription:req.body.richDescription,
                brand: req.body.brand,
                price:req.body.price,
                category: req.body.category,
                countInStock:req.body.countInStock,
                rating:req.body.rating,
                numReview:req.body.numReview,
                isFeatured:req.body.isFeatured,
        },
        // this will return new data instead of the old one
        {new: true}
    ).populate('category')
    if(!product) {
        return res.status(500).json({success:false, message: 'product coud not be updated'})
    }
          
    res.send(product)
    
})


// delete product 
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
    .then(product => {
        if(product) {
            return res.status(200).json({success: true, message: 'the product is deleted'})
        }else{
            return res.status(404).json({success:false, message: "product could not be found"})
        }
    })
    .catch((err) => {
        return res.status(400).json({success: false, error: err})
    })
})

// get product count
router.get(`/get/product_count` , async (req, res) => {
    const productCount = await Product.countDocuments();
    if(!productCount) {
        return res.status(500).json({success: false, message:"product does not exist"})
    }
    res.send({ 
        totalProduct: productCount
    });
})


//featured
router.get(`/get/featured/:count` , async (req, res) => {
    // this count will limit how many featured product to be displayed
    const count = req.params.count ? req.params.count:0
    // as count is returning string value we need to make sure count is numeric 
    // by adding + sign in front of count
    const productFeatured = await Product.find({isFeatured: true}).limit(+count);
    if(!productFeatured) {
        return res.status(500).json({success: false, message:"featured product does not exist"})
    }
    res.send(productFeatured);
})



// updating images in maxium of 10
router.put('/gallery-images/:id', uploadOption.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

    if (files) {
        files.map((file) => {
            imagesPaths.push(`${basePath}${file.filename}`);
        });
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        { new: true }
    );

    if (!product) return res.status(500).send('the gallery cannot be updated!');

    res.send(product);
});

module.exports  = router;  
