package jk.kamoru.flayground.image;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.image.banner.AnsiColors.BitDepth;
import jk.kamoru.flayground.image.banner.ImageBannerPrinter;
import jk.kamoru.flayground.image.banner.ImageBannerPrinter.PixelMode;
import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.service.ImageService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/banner")
public class ImageBannerHandler {

  @Autowired ImageService imageService;

  @Autowired ImageBannerPrinter imageBannerPrinter;

  @Autowired FlayProperties flayProperties;

  AtomicInteger counter = new AtomicInteger();

  @GetMapping("/{idx}/{width}/{height}")
  public String getBannerImage(@PathVariable int idx, @PathVariable int width, @PathVariable int height,
      @RequestParam(required = false, defaultValue = "false") boolean invert,
      @RequestParam(required = false, defaultValue = "FOUR") BitDepth bitDepth,
      @RequestParam(required = false, defaultValue = "TEXT") PixelMode pixelMode) {
    Image image = imageService.get(idx);
    return imageBannerPrinter.get(image.getFile(), width, height, 0, invert, bitDepth, pixelMode);
  }

  @PostMapping("/upload")
  @ResponseBody
  public String upload(@RequestParam("file") MultipartFile multipartFile, @RequestParam("width") int width) {
    if (multipartFile == null) {
      throw new RuntimeException("file is null");
    }

    File uploadDir = new File(flayProperties.getImagePaths()[0] + "/_upload");
    Assert.state(uploadDir.exists(), "upload path is not exists");
    Assert.state(uploadDir.isDirectory(), "upload path is not directory");

    int fileIdx = counter.incrementAndGet();
    log.info("{} uploadfile {}, {}, {} ", fileIdx, multipartFile.getOriginalFilename(), multipartFile.getContentType(), multipartFile.getSize());

    File targetImageFile = new File(uploadDir, "banner." + fileIdx + "." + multipartFile.getOriginalFilename());
    try {
      multipartFile.transferTo(targetImageFile);
    } catch (IOException e) {
      FileUtils.deleteQuietly(targetImageFile);
      throw new IllegalStateException("upload image failed " + e.getMessage(), e);
    }

    return imageBannerPrinter.get(targetImageFile, width, 0, 0, true, BitDepth.FOUR, PixelMode.TEXT);
  }


}
