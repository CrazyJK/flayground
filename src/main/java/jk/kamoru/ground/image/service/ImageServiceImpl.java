package jk.kamoru.ground.image.service;

import java.util.List;

import org.apache.commons.rng.UniformRandomProvider;
import org.apache.commons.rng.simple.RandomSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.image.domain.Image;
import jk.kamoru.ground.image.source.ImageSource;

@Service
public class ImageServiceImpl implements ImageService {

  UniformRandomProvider rng = RandomSource.XO_RO_SHI_RO_128_PP.create();

  @Autowired
  ImageSource imageSource;

  @Override
  public List<Image> list() {
    return imageSource.list();
  }

  @Override
  public Image get(int idx) {
    return imageSource.get(idx);
  }

  @Override
  public Image random() {
    return imageSource.get(rng.nextInt(0, size()));
  }

  @Override
  public int size() {
    return imageSource.size();
  }

  @Override
  public void delete(int idx) {
    imageSource.delete(idx);
  }

}
