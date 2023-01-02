package jk.kamoru.flayground.base.web.attach;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jk.kamoru.flayground.base.web.attach.Attach.Ticket;

@Service
public class AttachServiceImpl implements AttachService {

  @Autowired AttachPocket attachPocket;

  @Override
  public List<Ticket> saveInPocket(MultipartFile[] multipartFiles) {
    return attachPocket.in(multipartFiles);
  }

  @Override
  public Ticket removeInPocket(String key) {
    return attachPocket.out(key).getTicket();
  }

}
