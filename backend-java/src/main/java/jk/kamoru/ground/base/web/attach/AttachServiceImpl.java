package jk.kamoru.ground.base.web.attach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jk.kamoru.ground.base.web.attach.Attach.Type;

@Service
public class AttachServiceImpl implements AttachService {

  @Autowired
  AttachSource attachSource;

  @Override
  public Attach get(String id) {
    return attachSource.get(id);
  }

  @Override
  public Attach create(String name, Type type) {
    final String id = AttachUtils.generateStringHash(name, type.name());
    try {
      return attachSource.get(id);
    } catch (AttachNotfoundException e) {
      Attach attach = attachSource.create(id, name, type);
      return attachSource.save(attach);
    }
  }

  @Override
  public Attach upload(String id, MultipartFile[] multipartFiles) {
    Attach attach = attachSource.get(id);
    attach.add(multipartFiles);
    return attachSource.save(attach);
  }

  @Override
  public Attach remove(String id, String attachFileId) {
    Attach attach = attachSource.get(id);
    attach.remove(attachFileId);
    return attachSource.save(attach);
  }

}
