package jk.kamoru.flayground.diary;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Diary {

  @Data
  static class Meta {
    private String date;
    private String weather;
    private String title;
    private Date created = new Date();
    private Date lastModified;
  }

  @AllArgsConstructor
  @NoArgsConstructor
  @Data
  static class Attach {
    private File file;
    private String name;
    private String contentType;
    private long size;
  }

  private Meta meta;
  private List<Attach> attachs;
  private String content;

  private String[] addedAttachUniqueKeys;

  void addAttach(Attach attach) {
    if (attachs == null) {
      attachs = new ArrayList<>();
    }
    attachs.add(attach);
  }

  void resetAddedAttachUniqueKeys() {
    addedAttachUniqueKeys = null;
  }

}
