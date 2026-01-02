package jk.kamoru.ground.image.source;

import java.util.List;

import jk.kamoru.ground.image.domain.Image;

public interface ImageSource {

  List<Image> list();

  int size();

  Image get(int idx);

  void delete(int idx);
}
