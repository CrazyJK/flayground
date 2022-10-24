package jk.kamoru.flayground.flay.domain;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.math.NumberUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;
import lombok.Data;

@Data
public class Flay {

  public static final String MOVIE = "movie";
  public static final String SUBTI = "subtitles";
  public static final String COVER = "cover";
  public static final String CANDI = "candidate";

  // key
  String studio;
  String opus;
  String title;
  List<String> actressList;
  String release;

  int score;
  int actressPoint;
  int studioPoint;

  boolean archive = false;

  Video video;

  // files
  Map<String, List<File>> files = new HashMap<>();

  public Flay() {
    files.put(MOVIE, new ArrayList<>());
    files.put(SUBTI, new ArrayList<>());
    files.put(COVER, new ArrayList<>());
    files.put(CANDI, new ArrayList<>());
  }

  public long getLength() {
    return files.get(MOVIE).stream().mapToLong(File::length).sum()
        + files.get(SUBTI).stream().mapToLong(File::length).sum()
        + files.get(COVER).stream().mapToLong(File::length).sum();
  }

  public long getLastModified() {
    return NumberUtils.max(
        files.get(MOVIE).stream().mapToLong(File::lastModified).max().orElse(-1),
        files.get(SUBTI).stream().mapToLong(File::lastModified).max().orElse(-1),
        files.get(COVER).stream().mapToLong(File::lastModified).max().orElse(-1));
  }

  public void addMovieFile(File file) {
    files.get(MOVIE).add(file);
  }

  public void addSubtitlesFile(File file) {
    files.get(SUBTI).add(file);
  }

  public void addCoverFile(File file) {
    files.get(COVER).add(file);
  }

  public void addCandidatesFile(File file) {
    files.get(CANDI).add(file);
  }

  @JsonIgnore
  public File getCover() {
    if (archive) {
      return files.get(COVER).size() > 0 ? files.get(COVER).get(0) : null;
    } else {
      return files.get(COVER).get(0);
    }
  }

  @JsonIgnore
  public String getFullname() {
    return String.format("[%s][%s][%s][%s][%s]", studio, opus, title, getActressName(), release);
  }

  @JsonIgnore
  public String getActressName() {
    return String.join(", ", actressList);
  }

  @JsonIgnore
  public String toQueryString() {
    return String.format("%s[%s][%s]%s[rank%s]", getFullname(), video.getTitle(), video.getDesc(), String.join(",", video.getTags().stream().map(Tag::getName).toList()), archive ? "-1" : video.getRank());
  }

}
