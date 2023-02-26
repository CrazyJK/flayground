package jk.kamoru.flayground.info;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ActressConverter {

  @Test
  void test() throws Exception {
    ActressConverter converter = new ActressConverter();
    converter.start();
  }

  String infoPath = "J:\\Crazy\\Info\\actress.jsonX";

  private void start() throws JsonParseException, JsonMappingException, IOException {
    ObjectMapper mapper = new ObjectMapper();
    File infoFile = new File(infoPath);

    List<FromActress> fromList = mapper.readValue(infoFile, new TypeReference<List<FromActress>>() {});
    List<ToActress> toList = new ArrayList<>();

    for (FromActress from : fromList) {
      ToActress to = new ToActress();
      to.setName(from.getName());
      to.setLocalName(from.getLocalName());
      to.setBirth(from.getBirth());
      to.setBody(from.getBody());
      to.setHeight(from.getHeight());
      to.setDebut(from.getDebut());
      to.setComment(from.getComment());
      to.setFavorite(from.isFavorite());
      System.out.println(to);
      toList.add(to);
    }

    ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();
    writer.writeValue(infoFile, toList);
  }
}


@AllArgsConstructor
@NoArgsConstructor
@Data
class ToActress {

  @NotNull String name;
  String localName;
  String birth;
  String body;
  int height;
  int debut;
  String comment;
  boolean favorite;
  @JsonIgnore List<File> covers;

  public ToActress(String name) {
    this.localName = "";
    this.birth = "";
    this.body = "";
    this.height = 0;
    this.debut = 0;
    this.comment = "";
    this.favorite = false;
  }

  public int getCoverSize() {
    return covers == null ? 0 : covers.size();
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (getClass() != obj.getClass())
      return false;
    ToActress other = (ToActress) obj;
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


@AllArgsConstructor
@NoArgsConstructor
@Data
class FromActress {

  @NotNull String name;
  String localName;
  String birth;
  String body;
  int height;
  int debut;
  String comment;
  boolean favorite;
  @JsonIgnore File cover;

  public FromActress(String name) {
    this.localName = "";
    this.birth = "";
    this.body = "";
    this.height = 0;
    this.debut = 0;
    this.comment = "";
    this.favorite = false;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (getClass() != obj.getClass())
      return false;
    FromActress other = (FromActress) obj;
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
