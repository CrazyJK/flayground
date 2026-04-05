package jk.kamoru.ground.image.service;

import java.util.List;

import jk.kamoru.ground.image.domain.Image;

public interface ImageService {

  List<Image> list();

  Image get(int idx);

  Image random();

  int size();

  void delete(int idx);

}
