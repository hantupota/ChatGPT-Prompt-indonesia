$.post('https://api.shortpixel.com/v2/reducer.php',JSON.stringify({
    "key": "NjnC85RLD4LH71Eq9UP2",
    "plugin_version": "JS123",
    "lossy": 1,
    "resize": 0,
    "cmyk2rgb": 1,
    "refresh": 0,
    "urllist": ["https://goldenbuzzers.blogspot.com", "https://blogger.googleusercontent.com"]
}), function (data) {
    alert('success');
});
