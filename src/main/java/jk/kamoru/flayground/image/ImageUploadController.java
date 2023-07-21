package jk.kamoru.flayground.image;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.image.domain.Image;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "ImageUpload")
@Controller
@RequestMapping("/image")
public class ImageUploadController {

  @Autowired
  FlayProperties flayProperties;

  AtomicInteger counter = new AtomicInteger();

  @PostMapping("/upload")
  @ResponseBody
  public List<Image> upload(@RequestParam("file") MultipartFile[] multipartFiles) {
    if (multipartFiles == null) {
      throw new ImageException("file is null");
    }
    Assert.state(multipartFiles.length > 0, "file is zero");

    File uploadDir = new File(flayProperties.getImagePaths()[0] + "/_upload");
    Assert.state(uploadDir.exists(), "upload path is not exists");
    Assert.state(uploadDir.isDirectory(), "upload path is not directory");

    List<Image> images = new ArrayList<>();
    for (MultipartFile multipartFile : multipartFiles) {
      if (multipartFile.isEmpty()) {
        continue;
      }
      int fileIdx = counter.incrementAndGet();

      log.info("{} uploadfile {}, {}, {} ", fileIdx, multipartFile.getOriginalFilename(), multipartFile.getContentType(), multipartFile.getSize());

      File targetImageFile = new File(uploadDir, fileIdx + "." + multipartFile.getOriginalFilename());
      try {
        multipartFile.transferTo(targetImageFile);
        // FileUtils.copyInputStreamToFile(multipartFile.getInputStream(), targetImageFile);
      } catch (IOException e) {
        FileUtils.deleteQuietly(targetImageFile);
        throw new ImageException("upload image failed " + e.getMessage(), e);
      }
      images.add(new Image(targetImageFile, fileIdx));
    }
    return images;
  }

}
