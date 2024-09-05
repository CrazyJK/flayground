package jk.kamoru.ground.image.domain;

import java.io.File;

import org.apache.commons.io.FilenameUtils;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class Image {

  Integer idx;
  String name;
  String path;
  long length;
  long modified;
  File file;

  public Image(File file, Integer idx) {
    this.idx = idx;
    this.name = FilenameUtils.getBaseName(file.getName());
    this.path = file.getParent();
    this.length = file.length();
    this.modified = file.lastModified();
    this.file = file;
  }

}
