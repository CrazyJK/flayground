package jk.kamoru.flayground.info;

import java.util.Collection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.VideoInfoService;

@RestController
@RequestMapping("/info/video")
public class VideoController {

  @Autowired VideoInfoService videoInfoService;

  @GetMapping("/{opus}")
  public Video get(@PathVariable String opus) {
    return videoInfoService.get(opus);
  }

  @GetMapping("/list")
  public Collection<Video> list() {
    return videoInfoService.list();
  }

  @GetMapping("/find/{query}")
  public Collection<Video> find(@PathVariable String query) {
    return videoInfoService.find(query);
  }

  @PostMapping
  public Video create(@RequestBody Video video) {
    return videoInfoService.create(video);
  }

  @PatchMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@RequestBody Video video) {
    videoInfoService.update(video);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestBody Video video) {
    videoInfoService.delete(video);
  }

}
