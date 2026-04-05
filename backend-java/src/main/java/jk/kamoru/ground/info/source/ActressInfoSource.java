package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.image.domain.Image;
import jk.kamoru.ground.image.service.ImageService;
import jk.kamoru.ground.info.domain.Actress;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
    // list 에 Actress의 field 중 name가 중복인것 찾아서 경고
    Map<String, Long> nameCountMap = list.stream().collect(Collectors.groupingBy(Actress::getName, Collectors.counting()));
    nameCountMap.entrySet().stream().filter(entry -> entry.getValue() > 1)
        .forEach(entry -> log.warn("Duplicate actress name found: {} (count: {})", entry.getKey(), entry.getValue()));
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
