$.post('https://api.shortpixel.com/v2/reducer.php',JSON.stringify({
    "key": "NjnC85RLD4LH71Eq9UP2",
    "plugin_version": "JS123",
    "lossy": 1,
    "resize": 0,
    "cmyk2rgb": 1,
    "refresh": 0,
    "urllist": ["https://goldenbuzzers.blogspot.com", "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEglOG3CyW7Ng_Y1Upf2-tXlSY9SBOsuVMRcCgItbwWQM-5biCw308PjM0fZ8P3qLkzTp20MMHdAkpyP8iNMeCiI99Fhz0D9_nlqI8UkpkTIVDm0WU_wgPj38VnSwAOUJFB8EMTTjK4V8qEmTojXAI7a7KHD7PjLA4VxyDFlXLHDVd93lGJdtg-KcKK4nQ/s1600/2output.webp"]
}), function (data) {
    alert('success');
});
