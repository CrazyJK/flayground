package jk.kamoru.ground.info.domain;

import java.net.URL;
import java.util.Date;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Studio implements Info<String> {

  @NotBlank
  String name;
  String company;
  URL homepage;
  long lastModified;

  public Studio(String key) {
    setKey(key);
    this.company = "";
    this.homepage = null;
    this.lastModified = -1;
  }

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

}
