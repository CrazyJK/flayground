package jk.kamoru.flayground.base.web.attach;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.file.Files;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jk.kamoru.flayground.Flayground;

@RestController
@RequestMapping("/attach")
public class AttachController {

  @Autowired
  AttachService attachService;

  @GetMapping("/{id}")
  @ResponseBody
  public Attach get(@PathVariable String id) {
    return attachService.get(id);
  }

  @GetMapping("/{id}/{attachFileId}")
  @ResponseBody
  public AttachFile getAttachFile(@PathVariable String id, @PathVariable String attachFileId) {
    return attachService.get(id).getAttachFile(attachFileId);
  }

  @GetMapping("/{id}/{attachFileId}/download")
  public ResponseEntity<Object> getFile(@PathVariable String id, @PathVariable String attachFileId) throws IOException {
    AttachFile attachFile = attachService.get(id).getAttachFile(attachFileId);
    File file = attachFile.getFile();

    Resource resource = new InputStreamResource(Files.newInputStream(file.toPath()));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(ContentDisposition.builder("attachment").filename(URLEncoder.encode(attachFile.getName(), Flayground.CHARSET)).build());

    return new ResponseEntity<Object>(resource, headers, HttpStatus.OK);
  }

  @PostMapping("/create")
  @ResponseBody
  public Attach create(@RequestParam("name") String name, @RequestParam("type") Attach.Type type) {
    return attachService.create(name, type);
  }

  @PostMapping("/upload")
  @ResponseBody
  public Attach upload(@RequestParam("id") String id, @RequestParam("file") MultipartFile[] multipartFiles) {
    return attachService.upload(id, multipartFiles);
  }

  @DeleteMapping("/remove")
  @ResponseBody
  public Attach remove(@RequestParam("id") String id, @RequestParam("attachFileId") String attachFileId) {
    return attachService.remove(id, attachFileId);
  }

}
