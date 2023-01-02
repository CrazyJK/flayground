package jk.kamoru.flayground.base.web.attach;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import jk.kamoru.flayground.base.web.attach.Attach.Ticket;

public interface AttachService {

  List<Ticket> saveInPocket(MultipartFile[] multipartFiles);

  Ticket removeInPocket(String key);

}
