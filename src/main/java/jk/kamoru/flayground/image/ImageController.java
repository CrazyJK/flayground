package jk.kamoru.flayground.image;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jk.kamoru.flayground.flay.service.FlayActionHandler;
import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.service.ImageService;

@RestController
@RequestMapping("/image")
public class ImageController {

  @Autowired ImageService imageService;
  @Autowired FlayActionHandler flayActionHandler;

  @GetMapping("/list")
  public List<Image> list() {
    return imageService.list();
  }

  @GetMapping("/size")
  public int size() {
    return imageService.size();
  }

  @GetMapping("/random")
  public Image random() {
    return imageService.random();
  }

  @GetMapping("/{idx}")
  public Image get(@PathVariable int idx) {
    return imageService.get(idx);
  }

  @DeleteMapping("/{idx}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable int idx) {
    imageService.delete(idx);
  }

  @PatchMapping("/paint/{idx}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void paint(@PathVariable int idx) {
    flayActionHandler.paint(imageService.get(idx));
  }

}
