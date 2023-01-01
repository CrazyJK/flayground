package jk.kamoru.flayground.base.web.attach;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface AttachService {

  List<Attach> accept(MultipartFile[] multipartFiles);

  Attach remove(String key);

}
