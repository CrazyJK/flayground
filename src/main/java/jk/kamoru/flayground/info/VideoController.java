package jk.kamoru.flayground.info;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.TagInfoService;
import jk.kamoru.flayground.info.service.VideoInfoService;

@RestController
@RequestMapping("/info/video")
public class VideoController {

  @Autowired
  VideoInfoService videoInfoService;

  @Autowired
  TagInfoService tagInfoService;

  @GetMapping("/{opus}")
  public Video get(@PathVariable String opus) {
    return videoInfoService.get(opus);
  }

  @GetMapping
  public Collection<Video> list() {
    return videoInfoService.list();
  }

  @GetMapping("/find/{query}")
  public Collection<Video> find(@PathVariable String query) {
    return videoInfoService.find(query);
  }

  /**
   * 신규 생성
   * 
   * @param video
   * @return
   */
  @PostMapping
  public Video create(@RequestBody Video video) {
    return videoInfoService.create(video);
  }

  /**
   * 없으면 신규, 있으면 수정
   * 
   * @param video
   * @return
   */
  @PutMapping
  public Video put(@RequestBody Video video) {
    return videoInfoService.put(video);
  }

  /**
   * 기존 수정
   * 
   * @param video
   */
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

  @PutMapping("/rank/{opus}/{rank}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void setRank(@PathVariable String opus, @PathVariable int rank) {
    videoInfoService.setRank(opus, rank);
  }

  @PutMapping("/like/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void setLike(@PathVariable String opus) {
    videoInfoService.setLike(opus);
  }

  @PutMapping("/tag/{opus}/{tagId}/{checked}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void toggleTag(@PathVariable String opus, @PathVariable Integer tagId, @PathVariable boolean checked) {
    Tag tag = tagInfoService.get(tagId);
    videoInfoService.toggleTag(opus, tag, checked);
  }

  @PutMapping("/comment/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void setComment(@PathVariable String opus, @RequestBody String comment) {
    videoInfoService.setComment(opus, comment);
  }

}
