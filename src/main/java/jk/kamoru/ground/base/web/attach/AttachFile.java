package jk.kamoru.ground.base.web.attach;

import java.io.File;
import java.io.IOException;

import org.apache.commons.io.FileUtils;
import org.springframework.web.multipart.MultipartFile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 첨부 파일 객체
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
public class AttachFile {

  private String id;
  private String name;
  private String type;
  private long size;
  private File file;

  /**
   * 첨부 삭제
   */
  public void remove() {
    FileUtils.deleteQuietly(file);
  }

  public static AttachFile from(MultipartFile multipartFile, File dest) {
    final String originalFilename = multipartFile.getOriginalFilename();
    final String contentType = multipartFile.getContentType();
    final long size = multipartFile.getSize();

    try {
      if (dest == null)
        throw new IllegalArgumentException("dest file is null");
      multipartFile.transferTo(dest);
    } catch (IllegalStateException | IOException e) {
      throw new AttachException("multipartFile transfer fail: " + e.getMessage(), e);
    }

    final String id = AttachUtils.generateFileHash(dest);

    return new AttachFile(id, originalFilename, contentType, size, dest);
  }

}
