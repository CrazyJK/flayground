package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.info.domain.Video;

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

}
