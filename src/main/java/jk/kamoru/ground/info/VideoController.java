package jk.kamoru.ground.info;

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

import io.swagger.v3.oas.annotations.Operation;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.info.domain.Tag;
import jk.kamoru.ground.info.domain.Video;
import jk.kamoru.ground.info.service.TagInfoService;
import jk.kamoru.ground.info.service.VideoInfoService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Video")
@RestController
@RequestMapping(Ground.API_PREFIX + "/info/video")
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

  @Operation(summary = "신규 생성")
  @PostMapping
  public Video create(@RequestBody Video video) {
    return videoInfoService.create(video);
  }

  @Operation(summary = "없으면 신규, 있으면 수정")
  @PutMapping
  public Video put(@RequestBody Video video) {
    return videoInfoService.put(video);
  }

  @Operation(summary = "수정")
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
