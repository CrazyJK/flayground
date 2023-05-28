package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Supplier;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.service.ImageService;
import jk.kamoru.flayground.info.domain.Actress;

@Repository
public class ActressInfoSource extends InfoSourceJsonAdapter<Actress, String> {

  @Autowired
  FlayProperties flayProperties;
  @Autowired
  ImageService imageService;

  @Override
  File getInfoFile() {
    return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.ACTRESS);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Actress>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Actress>>() {
    };
  }

  @Override
  Actress newInstance(String actressname) {
    return new Actress(actressname);
  }

  @Override
  void extraInfoLoad() {
    for (Actress actress : list) {
      if (actress.getCovers() == null)
        actress.setCovers(findCoverFile(actress.getName()));
    }
  }

  private List<File> findCoverFile(String name) {
    Supplier<Stream<Image>> supplier = () -> imageService.list().stream().filter(i -> {
      return i.getName().startsWith(name);
    });
    long count = supplier.get().count();
    if (count == 0) {
      return null;
    } else {
      return supplier.get().map(Image::getFile).toList();
    }
  }

}
