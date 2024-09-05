package jk.kamoru.ground.base.web.attach;

import org.springframework.web.multipart.MultipartFile;

import jk.kamoru.ground.base.web.attach.Attach.Type;

public interface AttachService {

  /**
   * 첨부그룹 구한다
   * 
   * @param id
   * @return
   */
  Attach get(String id);

  /**
   * name과 type으로 새 첨부그룹ID를 만든다
   * 
   * @param name
   * @param type
   * @return
   */
  Attach create(String name, Type type);

  /**
   * 첨부그룹ID에 새 첨부를 추가한다
   * 
   * @param id
   * @param multipartFiles
   */
  Attach upload(String id, MultipartFile[] multipartFiles);

  /**
   * 첨부그룹ID에서 첨부를 삭제한다
   * 
   * @param id
   * @param attachFile
   */
  Attach remove(String id, String attachFileId);

}
