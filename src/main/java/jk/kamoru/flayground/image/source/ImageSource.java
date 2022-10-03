package jk.kamoru.flayground.image.source;

import java.util.List;
import jk.kamoru.flayground.image.domain.Image;

public interface ImageSource {

  List<Image> list();

  int size();

  Image get(int idx);

  void delete(int idx);
}
