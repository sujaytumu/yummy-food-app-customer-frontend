// Cloudinary serves any size/format on the fly: ask for an auto format (WebP/AVIF), auto quality and a max width
// instead of the full-size original. Non-Cloudinary URLs (and already-transformed ones) are returned untouched.
export const optimizeImage = (url, width = 600) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  if (/\/image\/upload\/[^/]*(f_auto|q_auto|w_\d+|c_[a-z]+)/.test(url)) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
};
