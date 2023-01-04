package jk.kamoru.flayground.base.web.attach;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import org.apache.commons.io.FileUtils;
import lombok.Builder;
import lombok.Data;

@Data
public class Attach implements Closeable {

  @Builder
  @Data
  static class Ticket {
    private String uniqueKey;
    private String filename;
  }


  private final File file;
  private final String uniqueKey;
  private final String name;
  private final String originalFilename;
  private final String contentType;
  private final long size;
  private final Ticket ticket;

  public Attach(File file, String uniqueKey, String name, String originalFilename, String contentType, long size) {
    this.file = file;
    this.uniqueKey = uniqueKey;
    this.name = name;
    this.originalFilename = originalFilename;
    this.contentType = contentType;
    this.size = size;
    this.ticket = Ticket.builder().uniqueKey(uniqueKey).filename(originalFilename).build();
  }

  @Override
  public void close() throws IOException {
    FileUtils.deleteQuietly(file);
  }

}
