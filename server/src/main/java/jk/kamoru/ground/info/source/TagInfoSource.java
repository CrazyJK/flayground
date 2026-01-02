package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.info.domain.Tag;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class TagInfoSource extends InfoSourceJsonAdapter<Tag, Integer> {

  @Autowired
  GroundProperties properties;

  @Override
  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.TAG);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Tag>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Tag>>() {
    };
  }

  @Override
  Tag newInstance(Integer key) {
    return new Tag(key);
  }

  @Override
  void extraInfoLoad() {
    // list 에 Tag의 field 중 name가 중복인것 찾아서 경고
    Map<String, Long> nameCountMap = list.stream().collect(Collectors.groupingBy(Tag::getName, Collectors.counting()));
    nameCountMap.entrySet().stream().filter(entry -> entry.getValue() > 1).forEach(entry -> log.warn("Duplicate tag name found: {} (count: {})", entry.getKey(), entry.getValue()));
  }

}
