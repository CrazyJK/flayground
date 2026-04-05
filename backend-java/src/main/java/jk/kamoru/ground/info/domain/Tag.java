package jk.kamoru.ground.info.domain;

import java.util.Date;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Tag implements Info<Integer>, Comparable<Tag> {

  @NotBlank
  Integer id;
  @NotBlank
  String name;
  String group;
  String description;
  long lastModified;

  public Tag(Integer key) {
    setKey(key);
    this.name = "";
    this.description = "";
    this.group = "";
    this.lastModified = -1;
  }

  @Override
  public Integer getKey() {
    return id;
  }

  @Override
  public void setKey(Integer key) {
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
    Tag other = (Tag) obj;
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
  public int compareTo(Tag tag) {
    return id - tag.id;
  }

}
