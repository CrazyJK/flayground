package jk.kamoru.ground.image;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.ground.flay.FlayNotfoundException;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.flay.service.FlayArchiveService;
import jk.kamoru.ground.flay.service.FlayService;
import jk.kamoru.ground.image.domain.Image;
import jk.kamoru.ground.image.service.ImageService;
import jk.kamoru.ground.info.source.ActressInfoSource;

@io.swagger.v3.oas.annotations.tags.Tag(name = "ImageRequestHandler")
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

  ObjectWriter jsonWriter = new ObjectMapper().writer();

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

  @GetMapping("/cover/{opus}/withData")
  @ResponseBody
  public HttpEntity<byte[]> getCoverWithData(@PathVariable String opus) throws IOException {
    Flay flay = null;
    try {
      flay = flayService.get(opus);
    } catch (FlayNotfoundException e) {
      flay = flayArchiveService.get(opus);
    }
    return getCoverEntity(flay);
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
    return getImageEntity(imageService.get(idx));
  }

  @GetMapping("/image/random")
  @ResponseBody
  public HttpEntity<byte[]> getImageRandom() throws IOException {
    return getImageEntity(imageService.random());
  }

  @GetMapping("/actress/{name}/{index}")
  @ResponseBody
  public HttpEntity<byte[]> getActressCover(@PathVariable String name, @PathVariable int index) throws IOException {
    return getImageEntity(actressInfoSource.get(name).getCovers().get(index));
  }

  HttpEntity<byte[]> getCoverEntity(Flay flay) throws IOException {
    File file = flay.getCover();
    if (file == null) {
      return null;
    }
    byte[] bytes = FileUtils.readFileToByteArray(file);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentLength(file.length());
    headers.setContentType(probeMediaType(file));
    headers.set("data", URLEncoder.encode(jsonWriter.writeValueAsString(flay), StandardCharsets.UTF_8));
    return new HttpEntity<byte[]>(bytes, headers);
  }

  HttpEntity<byte[]> getImageEntity(Image image) throws IOException {
    File file = image.getFile();
    if (file == null) {
      return null;
    }
    byte[] bytes = FileUtils.readFileToByteArray(file);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentLength(file.length());
    headers.setContentType(probeMediaType(file));
    headers.set("idx", String.valueOf(image.getIdx()));
    headers.set("name", URLEncoder.encode(image.getName(), StandardCharsets.UTF_8));
    headers.set("path", URLEncoder.encode(image.getPath(), StandardCharsets.UTF_8));
    headers.set("modified", String.valueOf(image.getModified()));
    return new HttpEntity<byte[]>(bytes, headers);
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
