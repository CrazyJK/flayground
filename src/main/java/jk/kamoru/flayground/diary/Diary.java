package jk.kamoru.flayground.diary;

import java.util.Date;
import lombok.Data;

@Data
public class Diary {

  private String date;
  private String weather;
  private String title;
  private String content;
  private Date created = new Date();
  private Date lastModified;

}
