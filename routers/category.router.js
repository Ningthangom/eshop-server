const { Category } = require('../models/category')
const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')


router.get('/', async (req, res) => {
    const categoryList = await Category.find();
    
    if(!categoryList) {
        res.status(500).json({success: false})

    }
    res.status(200).send(categoryList)
})  




// get a category with details
router.get('/:id', async(req,res) => {
       // check if the id is a valid mongo id 
   if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({success: false, message:"invalid category id"})
}
        const category = await Category.findById(req.params.id)
        if(!category) {
            return res.status(500).json({success:false, message: 'category coud not be found'})
        }
          
        res.send(category)
        
      
        
})

// update a category
router.put('/:id', async(req, res) =>{
       // check if the id is a valid mongo id 
   if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({success: false, message:"invalid category id"})
}
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon,
                color: req.body.color
            },
            // this will return new data instead of the old one
            {new: true}
        )
        if(!category) {
            return res.status(500).json({success:false, message: 'category coud not be found'})
        }
              
        res.send(category)
        
})

router.post('/', async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    })
    category = await category.save();
    if(!category) {
        res.status(404).send('the category was not created')
    }

    res.send(category)
});

//api/v1/categories/id
router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id)
    .then(category => {
        if(category) {
            return res.status(200).json({success: true, message: 'the category is deleted'})
        }else{
            return res.status(404).json({success:false, message: "category could not be found"})
        }
    })
    .catch((err) => {
        return res.status(400).json({success: false, error: err})
    })
})

router.get(`/get/category_count` , async (req, res) => {
    const categoryCount = await Category.countDocuments();
    if(!categoryCount) {
        return res.status(500).json({success: false, message:"category does not exist"})
    }
    res.send({ 
        totalCategory: categoryCount 
    });
})




module.exports  = router;