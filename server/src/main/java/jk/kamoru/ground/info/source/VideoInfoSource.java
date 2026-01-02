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
import jk.kamoru.ground.info.domain.Video;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class VideoInfoSource extends InfoSourceJsonAdapter<Video, String> {

  @Autowired
  GroundProperties properties;

  @Override
  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.VIDEO);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Video>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Video>>() {
    };
  }

  @Override
  Video newInstance(String key) {
    return new Video(key);
  }

  @Override
  void extraInfoLoad() {
    // list 에 Video의 field 중 opus가 중복인것 찾아서 경고
    Map<String, Long> opusCountMap = list.stream().collect(Collectors.groupingBy(Video::getOpus, Collectors.counting()));
    opusCountMap.entrySet().stream().filter(entry -> entry.getValue() > 1)
        .forEach(entry -> log.warn("Duplicate video opus found: {} (count: {})", entry.getKey(), entry.getValue()));
  }

}
