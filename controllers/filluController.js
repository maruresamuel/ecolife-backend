const Fillu = require('../models/Fillu');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// @desc    Get all fillus
// @route   GET /api/v1/fillus
// @access  Public
exports.getFillus = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single fillu
// @route   GET /api/v1/fillus/:id
// @access  Public
exports.getFillu = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name avatar rating'
    })
    .populate({
      path: 'reviews',
      populate: {
        path: 'user',
        select: 'name avatar'
      }
    });

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Increment view count
  fillu.views += 1;
  await fillu.save();

  res.status(200).json({
    success: true,
    data: fillu
  });
});

// @desc    Create new fillu
// @route   POST /api/v1/fillus
// @access  Private
exports.createFillu = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check for published fillu by user
  const publishedFillu = await Fillu.findOne({ user: req.user.id });

  // If the user is not an admin, they can only add one fillu
  if (publishedFillu && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a fillu`,
        400
      )
    );
  }

  // Parse location if provided
  if (req.body.location) {
    try {
      const loc = await geocoder.geocode(req.body.location);
      req.body.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
      };
    } catch (err) {
      console.error('Geocoding error:', err);
      return next(new ErrorResponse('Invalid location data', 400));
    }
  }

  const fillu = await Fillu.create(req.body);

  res.status(201).json({
    success: true,
    data: fillu
  });
});

// @desc    Update fillu
// @route   PUT /api/v1/fillus/:id
// @access  Private
exports.updateFillu = asyncHandler(async (req, res, next) => {
  let fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this fillu`,
        401
      )
    );
  }

  // If location is being updated, re-geocode
  if (req.body.location && req.body.location !== fillu.location.formattedAddress) {
    try {
      const loc = await geocoder.geocode(req.body.location);
      req.body.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
      };
    } catch (err) {
      console.error('Geocoding error:', err);
      return next(new ErrorResponse('Invalid location data', 400));
    }
  }

  fillu = await Fillu.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: fillu
  });
});

// @desc    Delete fillu
// @route   DELETE /api/v1/fillus/:id
// @access  Private
exports.deleteFillu = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this fillu`,
        401
      )
    );
  }

  // Delete associated images from cloud storage
  if (fillu.images && fillu.images.length > 0) {
    for (const image of fillu.images) {
      if (image.publicId) {
        await deleteFromCloudinary(image.publicId);
      }
    }
  }

  await fillu.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload photo for fillu
// @route   PUT /api/v1/fillus/:id/photo
// @access  Private
exports.filluPhotoUpload = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this fillu`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  const maxSize = process.env.MAX_FILE_UPLOAD || 1000000;
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${maxSize / 1000}KB`,
        400
      )
    );
  }

  try {
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.tempFilePath, {
      folder: 'fillu',
      width: 1000,
      height: 1000,
      crop: 'limit'
    });

    // If this is the first image, set it as primary
    const isPrimary = fillu.images.length === 0;

    // Add to images array
    fillu.images.push({
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary
    });

    await fillu.save();

    res.status(200).json({
      success: true,
      data: fillu.images
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return next(new ErrorResponse('Problem with file upload', 500));
  } finally {
    // Clean up temp file
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
  }
});

// @desc    Delete fillu photo
// @route   DELETE /api/v1/fillus/:id/photo/:photoId
// @access  Private
exports.deleteFilluPhoto = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this fillu`,
        401
      )
    );
  }

  // Find the photo to delete
  const photoIndex = fillu.images.findIndex(
    img => img._id.toString() === req.params.photoId
  );

  if (photoIndex === -1) {
    return next(new ErrorResponse(`Photo not found`, 404));
  }

  const photo = fillu.images[photoIndex];

  // Delete from Cloudinary
  if (photo.publicId) {
    try {
      await deleteFromCloudinary(photo.publicId);
    } catch (err) {
      console.error('Error deleting image from Cloudinary:', err);
      // Continue with deletion even if Cloudinary delete fails
    }
  }

  // Remove from array
  fillu.images.splice(photoIndex, 1);

  // If we deleted the primary image and there are other images, set the first one as primary
  if (photo.isPrimary && fillu.images.length > 0) {
    fillu.images[0].isPrimary = true;
  }

  await fillu.save();

  res.status(200).json({
    success: true,
    data: fillu.images
  });
});

// @desc    Set primary photo
// @route   PUT /api/v1/fillus/:id/photo/:photoId/set-primary
// @access  Private
exports.setPrimaryPhoto = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this fillu`,
        401
      )
    );
  }

  // Find the photo to set as primary
  const newPrimaryPhoto = fillu.images.find(
    img => img._id.toString() === req.params.photoId
  );

  if (!newPrimaryPhoto) {
    return next(new ErrorResponse(`Photo not found`, 404));
  }

  // Update all images to set isPrimary to false
  fillu.images.forEach(img => {
    img.isPrimary = false;
  });

  // Set the selected image as primary
  newPrimaryPhoto.isPrimary = true;

  await fillu.save();

  res.status(200).json({
    success: true,
    data: fillu.images
  });
});

// @desc    Get fillus within a radius
// @route   GET /api/v1/fillus/radius/:zipcode/:distance
// @access  Private
exports.getFillusInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth (3,963 mi / 6,378 km)
  const radius = distance / 3963;

  const fillus = await Fillu.find({
    'location.coordinates': {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    },
    status: 'active'
  });

  res.status(200).json({
    success: true,
    count: fillus.length,
    data: fillus
  });
});

// @desc    Get fillus by user
// @route   GET /api/v1/fillus/user/:userId
// @access  Public
exports.getFillusByUser = asyncHandler(async (req, res, next) => {
  const fillus = await Fillu.find({ user: req.params.userId, status: 'active' });

  res.status(200).json({
    success: true,
    count: fillus.length,
    data: fillus
  });
});

// @desc    Toggle fillu status (active/inactive)
// @route   PUT /api/v1/fillus/:id/status
// @access  Private
exports.toggleFilluStatus = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this fillu`,
        401
      )
    );
  }

  // Toggle status
  fillu.isActive = !fillu.isActive;
  
  // If deactivating, also set status to inactive
  if (!fillu.isActive) {
    fillu.status = 'inactive';
  } else {
    fillu.status = 'active';
  }

  await fillu.save();

  res.status(200).json({
    success: true,
    data: fillu
  });
});

// @desc    Mark fillu as sold
// @route   PUT /api/v1/fillus/:id/sold
// @access  Private
exports.markAsSold = asyncHandler(async (req, res, next) => {
  const fillu = await Fillu.findById(req.params.id);

  if (!fillu) {
    return next(
      new ErrorResponse(`Fillu not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is fillu owner or admin
  if (fillu.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this fillu`,
        401
      )
    );
  }

  // Update status to sold
  fillu.status = 'sold';
  fillu.isActive = false;
  fillu.soldAt = Date.now();
  
  // If buyer info is provided, save it
  if (req.body.buyerId) {
    fillu.buyer = req.body.buyerId;
  }

  await fillu.save();

  res.status(200).json({
    success: true,
    data: fillu
  });
});

// @desc    Get fillu statistics
// @route   GET /api/v1/fillus/stats
// @access  Private/Admin
exports.getFilluStats = asyncHandler(async (req, res, next) => {
  const stats = await Fillu.aggregate([
    {
      $match: { status: { $ne: 'draft' } }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalFillus = stats.reduce((acc, curr) => acc + curr.count, 0);
  const avgPrice = stats.reduce((acc, curr) => acc + curr.avgPrice, 0) / stats.length;

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalFillus,
      avgPrice: parseFloat(avgPrice.toFixed(2))
    }
  });
});
