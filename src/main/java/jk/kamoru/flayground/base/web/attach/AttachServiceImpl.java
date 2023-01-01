package jk.kamoru.flayground.base.web.attach;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AttachServiceImpl implements AttachService {

  @Autowired AttachQueue attachQueue; // FIXME 넣고 꺼내면 사라지는 특성이면, 뭐로 해야 하지?

  @Override
  public List<Attach> accept(MultipartFile[] multipartFiles) {
    // TODO Auto-generated method stub
    return null;
  }

  @Override
  public Attach remove(String key) {
    // TODO Auto-generated method stub
    return null;
  }

}
