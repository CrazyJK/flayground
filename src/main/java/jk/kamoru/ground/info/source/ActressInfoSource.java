package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.image.domain.Image;
import jk.kamoru.ground.image.service.ImageService;
import jk.kamoru.ground.info.domain.Actress;

@Repository
public class ActressInfoSource extends InfoSourceJsonAdapter<Actress, String> {

  @Autowired
  GroundProperties properties;
  @Autowired
  ImageService imageService;

  @Override
  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.ACTRESS);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Actress>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Actress>>() {
    };
  }

  @Override
  Actress newInstance(String actressName) {
    return new Actress(actressName);
  }

  @Override
  void extraInfoLoad() {
    for (Actress actress : list) {
      if (actress.getCovers() == null)
        actress.setCovers(findCoverFile(actress.getName()));
    }
  }

  private List<File> findCoverFile(String name) {
    Supplier<Stream<Image>> supplier = () -> imageService.list().stream().filter(image -> image.getName().startsWith(name));

    long count = supplier.get().count();
    if (count == 0) {
      return null;
    } else {
      return supplier.get().map(Image::getFile).toList();
    }
  }

}
