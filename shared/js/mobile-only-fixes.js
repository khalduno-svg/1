(function () {
  var mq = window.matchMedia('(max-width: 767px)');
  function swapMobileImages() {
    document.querySelectorAll('img[data-mobile-src][data-desktop-src]').forEach(function (img) {
      var target = mq.matches ? img.getAttribute('data-mobile-src') : img.getAttribute('data-desktop-src');
      if (target && img.getAttribute('src') !== target) {
        img.setAttribute('src', target);
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', swapMobileImages);
  } else {
    swapMobileImages();
  }
  if (mq.addEventListener) mq.addEventListener('change', swapMobileImages);
  else if (mq.addListener) mq.addListener(swapMobileImages);
})();
