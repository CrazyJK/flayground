package jk.kamoru.flayground.image;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Base64;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayArchiveService;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.image.service.ImageService;
import jk.kamoru.flayground.info.source.ActressInfoSource;

@Controller
@RequestMapping("/static")
public class ImageRequestHandler {

  @Autowired
  FlayService flayService;
  @Autowired
  FlayArchiveService flayArchiveService;
  @Autowired
  ImageService imageService;
  @Autowired
  ActressInfoSource actressInfoSource;

  @GetMapping("/cover/{opus}")
  @ResponseBody
  public HttpEntity<byte[]> getCover(@PathVariable String opus) throws IOException {
    Flay flay = null;
    try {
      flay = flayService.get(opus);
    } catch (FlayNotfoundException e) {
      flay = flayArchiveService.get(opus);
    }
    return getImageEntity(flay.getCover());
  }

  @GetMapping("/cover/{opus}/base64")
  @ResponseBody
  public String getBase64Cover(@PathVariable String opus) throws IOException {
    Flay flay = null;
    try {
      flay = flayService.get(opus);
    } catch (FlayNotfoundException e) {
      flay = flayArchiveService.get(opus);
    }
    if (flay == null) {
      return "";
    }
    File cover = flay.getCover();
    MediaType mediaType = probeMediaType(cover);

    return "data:" + mediaType + ";base64," + Base64.getEncoder().encodeToString(FileUtils.readFileToByteArray(cover));
  }

  @GetMapping("/image/{idx}")
  @ResponseBody
  public HttpEntity<byte[]> getImage(@PathVariable Integer idx) throws IOException {
    return getImageEntity(imageService.get(idx).getFile());
  }

  @GetMapping("/image/random")
  @ResponseBody
  public HttpEntity<byte[]> getImageRandom() throws IOException {
    return getImageEntity(imageService.random().getFile());
  }

  @GetMapping("/actress/{name}/{index}")
  @ResponseBody
  public HttpEntity<byte[]> getActressCover(@PathVariable String name, @PathVariable int index) throws IOException {
    return getImageEntity(actressInfoSource.get(name).getCovers().get(index));
  }

  HttpEntity<byte[]> getImageEntity(File file) throws IOException {
    if (file == null) {
      return null;
    }
    byte[] bytes = FileUtils.readFileToByteArray(file);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentLength(file.length());
    headers.setContentType(probeMediaType(file));
    return new HttpEntity<byte[]>(bytes, headers);
  }

  MediaType probeMediaType(File file) {
    try {
      return MediaType.valueOf(Files.probeContentType(file.toPath()));
    } catch (InvalidMediaTypeException | IOException e) {
      String suffix = StringUtils.substringAfterLast(file.getName(), ".");
      if ("webp".equalsIgnoreCase(suffix)) {
        return MediaType.valueOf("image/webp");
      }
      return MediaType.IMAGE_JPEG;
    }
  }

  @ExceptionHandler(ImageNotfoundException.class)
  @ResponseBody
  public ResponseEntity<byte[]> imageNotfound(ImageNotfoundException e) throws IOException {
    byte[] byteArray = FileUtils.readFileToByteArray(imageService.random().getFile());
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.IMAGE_JPEG);
    return new ResponseEntity<byte[]>(byteArray, headers, HttpStatus.BAD_REQUEST);
  }

}
