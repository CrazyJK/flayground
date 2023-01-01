package jk.kamoru.flayground.base.web.attach;

import java.io.File;
import lombok.Data;

@Data
public class Attach {

  private File file;

  private String uniqueKey;
  private String originalFilename;
  private String contentType;
  private long size;

}
