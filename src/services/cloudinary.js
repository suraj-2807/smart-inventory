import axios from "axios";

console.log("☁️ Cloudinary service ready");

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_upload"); // your preset

  const res = await axios.post(
    "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
    formData
  );

  return res.data.secure_url;
};
