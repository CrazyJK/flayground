package jk.kamoru.flayground.image.service;

import java.util.List;

import jk.kamoru.flayground.image.domain.Image;

public interface ImageService {

  List<Image> list();

  Image get(int idx);

  Image random();

  int size();

  void delete(int idx);

}
