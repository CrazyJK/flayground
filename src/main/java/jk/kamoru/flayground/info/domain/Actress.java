package jk.kamoru.flayground.info.domain;

import java.io.File;
import java.util.Date;
import java.util.List;
import javax.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Actress implements Info<String> {

  boolean favorite;
  @NotBlank String name;
  String localName;
  String birth;
  String body;
  int height;
  int debut;
  String comment;
  @JsonIgnore List<File> covers;
  long lastModified;

  public Actress(String name) {
    setKey(name);
    this.localName = "";
    this.birth = "";
    this.body = "";
    this.height = -1;
    this.debut = -1;
    this.comment = "";
    this.favorite = false;
    this.lastModified = -1;
  }

  public int getCoverSize() {
    return covers == null ? 0 : covers.size();
  }

  public void setCoverSize(int coverSize) {}

  @Override
  public String getKey() {
    return name;
  }

  @Override
  public void setKey(String key) {
    this.name = key;
  }

  @Override
  public void touch() {
    lastModified = new Date().getTime();
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (getClass() != obj.getClass())
      return false;
    Actress other = (Actress) obj;
    if (name == null) {
      if (other.name != null)
        return false;
    } else if (!name.equals(other.name))
      return false;
    return true;
  }

  @Override
  public int hashCode() {
    final int prime = 31;
    int result = 1;
    result = prime * result + ((name == null) ? 0 : name.hashCode());
    return result;
  }

}
