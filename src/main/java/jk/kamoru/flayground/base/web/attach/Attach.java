package jk.kamoru.flayground.base.web.attach;

import java.io.File;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.web.multipart.MultipartFile;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@NoArgsConstructor
@Data
public class Attach {

  static enum Type {
    DIARY, TEMP;
  }

  private String id;
  private String name;
  private Type type;
  private File basePath;

  private List<AttachFile> attachFiles = new CopyOnWriteArrayList<>();

  public Attach(String id, String name, Type type, File basePath) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.basePath = basePath;
  }

  public void add(MultipartFile[] multipartFiles) {
    File saveFolder = new File(basePath, type.name());
    if (!saveFolder.exists()) {
      saveFolder.mkdir();
    }

    final String filename = String.format("%s-%s", type.name(), name);
    int lastFileNumber = AttachUtils.getLastFileNumber(saveFolder, filename);

    for (MultipartFile multipartFile : multipartFiles) {
      File file = new File(saveFolder, filename + "." + ++lastFileNumber);
      AttachFile newAttachFile = AttachFile.from(multipartFile, file);
      log.debug("[add] new {}", newAttachFile);
      attachFiles.add(newAttachFile);
    }
    log.debug("[add] attachFiles {}", attachFiles);
  }

  /**
   *
   * @param attachFileId
   * @return
   * @throws AttachFileNotfoundException 찾지 못할때
   * @throws IllegalStateException 2개 이상일때
   */
  public AttachFile getAttachFile(String attachFileId) {
    final List<AttachFile> list = getAttachFiles().stream().filter((attachFile) -> attachFile.getId().equals(attachFileId)).toList();
    if (list == null || list.size() == 0) {
      throw new AttachFileNotfoundException(attachFileId);
    } else if (list.size() > 1) {
      throw new IllegalStateException("duplicated AttachFile by " + attachFileId);
    }
    return list.get(0);
  }

  public void remove(String attachFileId) {
    getAttachFile(attachFileId).remove();

    final List<AttachFile> list = getAttachFiles().stream().filter((attachFile) -> !attachFile.getId().equals(attachFileId)).toList();
    log.debug("[remove] attachFiles {}", list);

    attachFiles.clear();
    attachFiles.addAll(list);
  }

}
