package jk.kamoru.flayground.info.domain;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Video implements Info<String> {

  @NotBlank
  String opus;
  int play;
  int rank;
  long lastPlay;
  long lastAccess;
  long lastModified;
  String comment;
  String title;
  String desc;
  Set<Tag> tags;
  List<Date> likes;

  public Video(String key) {
    setKey(key);
    this.play = 0;
    this.rank = 0;
    this.lastPlay = -1;
    this.lastAccess = -1;
    this.lastModified = -1;
    this.comment = "";
    this.title = "";
    this.desc = "";
    this.tags = new TreeSet<>();
    this.likes = new ArrayList<>();
  }

  @Override
  public String getKey() {
    return opus;
  }

  @Override
  public void setKey(String key) {
    this.opus = key;
  }

  @Override
  public void touch() {
    lastModified = new Date().getTime();
  }

  public void increasePlayCount() {
    ++play;
    lastPlay = new Date().getTime();
  }

  public void initLikes() {
    if (likes == null) {
      likes = new ArrayList<>();
    }
  }

  public void addLike() {
    initLikes();
    likes.add(new Date());
  }

}
