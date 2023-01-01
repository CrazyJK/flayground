package jk.kamoru.flayground.base.web.attach;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/attach")
public class AttachController {

  @Autowired AttachService attachService;

  @PostMapping("/upload")
  @ResponseBody
  public List<Attach> upload(@RequestParam("file") MultipartFile[] multipartFiles) {
    if (multipartFiles == null) {
      throw new IllegalStateException("file is null");
    }
    Assert.state(multipartFiles.length > 0, "file length is zero");

    return attachService.accept(multipartFiles);
  }

  @DeleteMapping("/remove")
  @ResponseBody
  public Attach remove(@RequestParam("key") String key) {
    return attachService.remove(key);
  }

}
