// config/cloudinaryConfig.js
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function createCloudinaryStorage(folderName = "uploads") {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "mp4"],
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    },
  });
}

module.exports = { cloudinary, createCloudinaryStorage };
