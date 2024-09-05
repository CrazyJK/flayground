package jk.kamoru.ground.todayis.domain;

import java.io.File;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor
@Data
public class Todayis {

  String name;
  String path;
  long length;
  long lastModified;
  String uuid;

  public static Todayis toInstance(File file) {
    return new Todayis(file.getName(), file.getParent(), file.length(), file.lastModified(), UUID.randomUUID().toString());
  }

  @JsonIgnore
  public String getFilePath() {
    return path + File.separator + name;
  }

}
