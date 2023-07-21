package jk.kamoru.ground.base.web.attach;

import jk.kamoru.ground.base.web.attach.Attach.Type;

public interface AttachSource {

  /**
   * 첨부 생성
   * 
   * @param id
   * @param name
   * @param type
   * @return
   */
  Attach create(String id, String name, Type type);

  /**
   * 첨부 반환
   * 
   * @param id
   * @return
   * @throws AttachNotfoundException 없을때
   */
  Attach get(String id) throws AttachNotfoundException;

  /**
   * 첨부 저장
   * 
   * @param attach
   * @return
   */
  Attach save(Attach attach);

}
