package jk.kamoru.ground.info.domain;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class TagGroup implements Info<String>, Comparable<TagGroup> {

  @NotBlank
  String id;
  @NotBlank
  String name;
  String desc;
  @JsonIgnore
  long lastModified;

  public TagGroup(String key) {
    setKey(key);
    this.name = "";
    this.desc = "";
    this.lastModified = -1;
  }

  @Override
  public String getKey() {
    return id;
  }

  @Override
  public void setKey(String key) {
    this.id = key;
  }

  @Override
  public void touch() {
    lastModified = new Date().getTime();
  }

  /*
   * id로 비교
   */
  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (getClass() != obj.getClass())
      return false;
    TagGroup other = (TagGroup) obj;
    if (id == null) {
      if (other.id != null)
        return false;
    } else if (!id.equals(other.id))
      return false;
    return true;
  }

  @Override
  public int hashCode() {
    final int prime = 31;
    int result = 1;
    result = prime * result + ((id == null) ? 0 : id.hashCode());
    return result;
  }

  @Override
  public int compareTo(TagGroup tagGroup) {
    return id.compareTo(tagGroup.id);
  }

}
