package jk.kamoru.flayground.diary;

import java.util.Date;
import lombok.Data;

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

  private Meta meta;
  private String content;

}
